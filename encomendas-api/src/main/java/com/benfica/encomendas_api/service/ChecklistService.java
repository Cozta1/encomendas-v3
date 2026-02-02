package com.benfica.encomendas_api.service;

import com.benfica.encomendas_api.dto.ChecklistBoardDTO;
import com.benfica.encomendas_api.dto.ChecklistCardDTO;
import com.benfica.encomendas_api.dto.ChecklistItemDTO;
import com.benfica.encomendas_api.dto.ChecklistLogRequestDTO;
import com.benfica.encomendas_api.model.*;
import com.benfica.encomendas_api.repository.*;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ChecklistService {

    @Autowired
    private ChecklistBoardRepository boardRepository;

    @Autowired
    private ChecklistCardRepository cardRepository;

    @Autowired
    private ChecklistItemRepository itemRepository;

    @Autowired
    private ChecklistLogRepository logRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private EquipeRepository equipeRepository;

    /**
     * Monta a visão do dia para o funcionário ou adm.
     * Busca a estrutura estática (Boards/Cards/Itens) e preenche com o estado dinâmico (Logs do dia).
     */
    @Transactional(readOnly = true)
    public List<ChecklistBoardDTO> getChecklistDoDia(UUID equipeId, Long usuarioId, LocalDate dataReferencia) {
        // 1. Busca os quadros da equipe
        List<ChecklistBoard> boards = boardRepository.findByEquipeId(equipeId);

        // 2. Busca o histórico de marcações deste usuário nesta data específica
        // Isso garante que o checklist "renove" a cada dia (pois buscamos logs apenas da dataReferencia)
        List<ChecklistLog> logsDoDia = logRepository.findByUsuarioIdAndDataReferencia(usuarioId, dataReferencia);

        // 3. Monta o DTO combinando estrutura + estado
        return boards.stream().map(board -> {

            // Mapeia os cards usando o método auxiliar corrigido
            List<ChecklistCardDTO> cardsDTO = board.getCards().stream()
                    .map(card -> mapCardToDTO(card, logsDoDia, dataReferencia))
                    .collect(Collectors.toList());

            return ChecklistBoardDTO.builder()
                    .id(board.getId())
                    .nome(board.getNome())
                    .equipeId(board.getEquipe().getId())
                    .cards(cardsDTO)
                    .build();
        }).collect(Collectors.toList());
    }

    /**
     * Método auxiliar para converter Card em DTO e calcular seu status e itens marcados.
     */
    private ChecklistCardDTO mapCardToDTO(ChecklistCard card, List<ChecklistLog> logsDoDia, LocalDate data) {
        String status = calcularStatusCartao(card, data);

        List<ChecklistItemDTO> itens = card.getItens().stream().map(item -> {
            // Verifica se existe log para este item no dia.
            // Se existir mais de um, o reduce pega o mais recente.
            boolean marcado = logsDoDia.stream()
                    .filter(log -> log.getItem().getId().equals(item.getId()))
                    .reduce((primeiro, segundo) -> segundo)
                    .map(ChecklistLog::getValor)
                    .orElse(false);

            return ChecklistItemDTO.builder()
                    .id(item.getId())
                    .descricao(item.getDescricao())
                    .ordem(item.getOrdem())
                    .marcado(marcado)
                    .build();
        }).collect(Collectors.toList());

        return ChecklistCardDTO.builder()
                .id(card.getId())
                .titulo(card.getTitulo())
                .horarioAbertura(card.getHorarioAbertura())
                .horarioFechamento(card.getHorarioFechamento())
                .itens(itens)
                .status(status)
                .build();
    }

    /**
     * Define o status do cartão (Bloqueado, Aberto, Fechado/Atrasado) baseada na hora atual.
     */
    private String calcularStatusCartao(ChecklistCard card, LocalDate dataReferencia) {
        LocalDate hoje = LocalDate.now();
        LocalTime agora = LocalTime.now();

        // Se for dia passado, é apenas histórico (readonly)
        if (dataReferencia.isBefore(hoje)) {
            return "HISTORICO";
        }

        // Se for dia futuro, não deve estar liberado
        if (dataReferencia.isAfter(hoje)) {
            return "FUTURO";
        }

        // Lógica para o dia atual (HOJE)
        if (agora.isBefore(card.getHorarioAbertura())) {
            return "PENDENTE"; // Ainda não abriu (bloqueado, cinza)
        } else if (agora.isAfter(card.getHorarioFechamento())) {
            return "FECHADO"; // Já fechou (vermelho se incompleto no front)
        } else {
            return "ABERTO"; // Disponível para marcar (verde/azul)
        }
    }

    /**
     * Registra a ação de marcar/desmarcar criando um NOVO log imutável.
     */
    @Transactional
    public void registrarAcao(ChecklistLogRequestDTO request, Long usuarioId) {
        // 1. Busca o item para ter acesso ao Card e horários
        ChecklistItem item = itemRepository.findById(request.getItemId())
                .orElseThrow(() -> new EntityNotFoundException("Item não encontrado"));

        ChecklistCard card = item.getCard();
        LocalTime agora = LocalTime.now();

        // 2. Validações de Regra de Negócio

        // Só pode editar o checklist de HOJE
        if (!request.getDataReferencia().isEqual(LocalDate.now())) {
            throw new IllegalArgumentException("Não é possível alterar checklists de datas passadas ou futuras.");
        }

        // Só pode editar dentro do horário permitido pelo cartão
        if (agora.isBefore(card.getHorarioAbertura()) || agora.isAfter(card.getHorarioFechamento())) {
            throw new IllegalArgumentException("Este cartão não está disponível neste horário (Fora da janela de abertura).");
        }

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));

        // 3. Cria o Log (Insert-Only pattern para auditoria)
        ChecklistLog log = ChecklistLog.builder()
                .item(item)
                .usuario(usuario)
                .dataReferencia(request.getDataReferencia())
                // dataHoraAcao é preenchida automaticamente pelo @CreationTimestamp da entidade
                .valor(request.getValor())
                .build();

        logRepository.save(log);
    }

    // --- Métodos Administrativos (Criação de Estrutura) ---

    @Transactional
    public ChecklistBoardDTO criarBoard(String nome, UUID equipeId) {
        Equipe equipe = equipeRepository.findById(equipeId)
                .orElseThrow(() -> new EntityNotFoundException("Equipe não encontrada"));

        ChecklistBoard board = ChecklistBoard.builder()
                .nome(nome)
                .equipe(equipe)
                .build();

        ChecklistBoard salvo = boardRepository.save(board);

        return ChecklistBoardDTO.builder()
                .id(salvo.getId())
                .nome(salvo.getNome())
                .equipeId(salvo.getEquipe().getId())
                .build();
    }

    @Transactional
    public ChecklistCardDTO adicionarCard(UUID boardId, String titulo, LocalTime inicio, LocalTime fim) {
        ChecklistBoard board = boardRepository.findById(boardId)
                .orElseThrow(() -> new EntityNotFoundException("Board não encontrado"));

        ChecklistCard card = ChecklistCard.builder()
                .titulo(titulo)
                .board(board)
                .horarioAbertura(inicio)
                .horarioFechamento(fim)
                .build();

        ChecklistCard salvo = cardRepository.save(card);

        return ChecklistCardDTO.builder()
                .id(salvo.getId())
                .titulo(salvo.getTitulo())
                .horarioAbertura(salvo.getHorarioAbertura())
                .horarioFechamento(salvo.getHorarioFechamento())
                .build();
    }

    @Transactional
    public void adicionarItem(UUID cardId, String descricao, Integer ordem) {
        ChecklistCard card = cardRepository.findById(cardId)
                .orElseThrow(() -> new EntityNotFoundException("Card não encontrado"));

        ChecklistItem item = ChecklistItem.builder()
                .descricao(descricao)
                .card(card)
                .ordem(ordem)
                .build();

        itemRepository.save(item);
    }
}