package com.benfica.encomendas_api.service;

import com.benfica.encomendas_api.dto.NotificacaoDTO;
import com.benfica.encomendas_api.model.Equipe;
import com.benfica.encomendas_api.model.Notificacao;
import com.benfica.encomendas_api.model.Usuario;
import com.benfica.encomendas_api.repository.EquipeRepository;
import com.benfica.encomendas_api.repository.NotificacaoRepository;
import com.benfica.encomendas_api.repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class NotificacaoService {

    @Autowired
    private NotificacaoRepository notificacaoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private EquipeRepository equipeRepository;

    @Transactional(readOnly = true)
    public List<NotificacaoDTO> getNotificacoes(Long usuarioId) {
        return notificacaoRepository.findByDestinatarioIdOrderByDataEnvioDesc(usuarioId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long getContadorNaoLidas(Long usuarioId) {
        return notificacaoRepository.countByDestinatarioIdAndLidaFalse(usuarioId);
    }

    @Transactional
    public void marcarTodasLidas(Long usuarioId) {
        notificacaoRepository.marcarTodasLidas(usuarioId);
    }

    @Transactional
    public void marcarLida(UUID notificacaoId) {
        Notificacao n = notificacaoRepository.findById(notificacaoId)
                .orElseThrow(() -> new EntityNotFoundException("Notificação não encontrada"));
        n.setLida(true);
        notificacaoRepository.save(n);
    }

    /**
     * Admin manda notificação para um usuário específico ou para toda a equipe (destinatarioId == null).
     */
    @Transactional
    public void enviarNotificacao(UUID equipeId, Long destinatarioId, Long remetenteId,
                                   String titulo, String mensagem) {
        Equipe equipe = equipeRepository.findById(equipeId)
                .orElseThrow(() -> new EntityNotFoundException("Equipe não encontrada"));

        Usuario remetente = null;
        if (remetenteId != null) {
            remetente = usuarioRepository.findById(remetenteId)
                    .orElseThrow(() -> new EntityNotFoundException("Remetente não encontrado"));
        }

        if (destinatarioId != null) {
            // Enviar para usuário específico
            Usuario dest = usuarioRepository.findById(destinatarioId)
                    .orElseThrow(() -> new EntityNotFoundException("Destinatário não encontrado"));
            criarNotificacao(equipe, dest, remetente, titulo, mensagem, null);
        } else {
            // Enviar para toda a equipe
            final Usuario finalRemetente = remetente;
            equipe.getMembros().forEach(membro ->
                    criarNotificacao(equipe, membro, finalRemetente, titulo, mensagem, null)
            );
        }
    }

    /**
     * Notifica todos os admins da equipe (usado pelo scheduler automaticamente).
     */
    @Transactional
    public void notificarAdmins(UUID equipeId, String titulo, String mensagem, String chaveDedup) {
        if (notificacaoRepository.existsByChaveDedup(chaveDedup)) {
            return; // Already notified
        }

        Equipe equipe = equipeRepository.findById(equipeId)
                .orElseThrow(() -> new EntityNotFoundException("Equipe não encontrada"));

        List<Usuario> admins = equipe.getMembros().stream()
                .filter(u -> "ROLE_ADMIN".equals(u.getRole()) || "ROLE_SUPER_ADMIN".equals(u.getRole()))
                .collect(Collectors.toList());

        // Include the team administrator if not already in list
        Usuario administrador = equipe.getAdministrador();
        boolean adminJaIncluso = admins.stream().anyMatch(u -> u.getId().equals(administrador.getId()));
        if (!adminJaIncluso) {
            admins.add(administrador);
        }

        // Use chaveDedup only on the first notification to prevent duplicates
        boolean primeiraNotif = true;
        for (Usuario admin : admins) {
            String chave = primeiraNotif ? chaveDedup : null;
            criarNotificacao(equipe, admin, null, titulo, mensagem, chave);
            primeiraNotif = false;
        }
    }

    private void criarNotificacao(Equipe equipe, Usuario dest, Usuario remetente,
                                   String titulo, String mensagem, String chaveDedup) {
        Notificacao n = Notificacao.builder()
                .equipe(equipe)
                .destinatario(dest)
                .remetente(remetente)
                .titulo(titulo)
                .mensagem(mensagem)
                .chaveDedup(chaveDedup)
                .build();
        notificacaoRepository.save(n);
    }

    private NotificacaoDTO toDTO(Notificacao n) {
        return NotificacaoDTO.builder()
                .id(n.getId())
                .titulo(n.getTitulo())
                .mensagem(n.getMensagem())
                .lida(n.isLida())
                .dataEnvio(n.getDataEnvio())
                .remetenteId(n.getRemetente() != null ? n.getRemetente().getId() : null)
                .remetenteNome(n.getRemetente() != null ? n.getRemetente().getNomeCompleto() : null)
                .destinatarioNome(n.getDestinatario().getNomeCompleto())
                .build();
    }
}
