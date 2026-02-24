package com.benfica.encomendas_api.service;

import com.benfica.encomendas_api.model.ChecklistCard;
import com.benfica.encomendas_api.model.ChecklistLog;
import com.benfica.encomendas_api.model.Usuario;
import com.benfica.encomendas_api.repository.ChecklistCardRepository;
import com.benfica.encomendas_api.repository.ChecklistLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Component
public class ChecklistScheduler {

    @Autowired
    private ChecklistCardRepository cardRepository;

    @Autowired
    private ChecklistLogRepository logRepository;

    @Autowired
    private NotificacaoService notificacaoService;

    /**
     * Runs every 5 minutes and checks for cards that closed in the last 6 minutes
     * with incomplete items. Notifies all team admins.
     */
    @Scheduled(fixedDelay = 5 * 60 * 1000)
    @Transactional
    public void verificarChecklistsFechadas() {
        LocalDate hoje = LocalDate.now();
        LocalTime agora = LocalTime.now();
        LocalTime janela = agora.minusMinutes(6);

        List<ChecklistCard> cardsRecemFechados =
                cardRepository.findCardsRecentlyClosedBetween(janela, agora);

        for (ChecklistCard card : cardsRecemFechados) {
            if (card.getItens() == null || card.getItens().isEmpty()) continue;

            UUID equipeId = card.getBoard().getEquipe().getId();

            // Determine which users should have completed this card
            List<Usuario> membros;
            if (card.getBoard().getUsuarioEspecifico() != null) {
                membros = List.of(card.getBoard().getUsuarioEspecifico());
            } else {
                membros = card.getBoard().getEquipe().getMembros();
            }

            for (Usuario membro : membros) {
                List<ChecklistLog> logs = logRepository.findByUsuarioIdAndDataReferencia(membro.getId(), hoje);

                boolean todosCompletos = card.getItens().stream().allMatch(item ->
                        logs.stream()
                                .filter(log -> log.getItem().getId().equals(item.getId()))
                                .reduce((first, second) -> second)
                                .map(ChecklistLog::getValor)
                                .orElse(false)
                );

                if (!todosCompletos) {
                    String chaveDedup = "auto:fechado:" + card.getId() + ":" + membro.getId() + ":" + hoje;
                    String titulo = "Checklist fechada incompleta";
                    String mensagem = membro.getNomeCompleto() + " não completou o cartão '" +
                            card.getTitulo() + "' (fechado às " +
                            card.getHorarioFechamento().toString().substring(0, 5) + ").";

                    notificacaoService.notificarAdmins(equipeId, titulo, mensagem, chaveDedup);
                }
            }
        }
    }
}
