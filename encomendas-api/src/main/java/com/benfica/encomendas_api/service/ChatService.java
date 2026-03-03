package com.benfica.encomendas_api.service;

import com.benfica.encomendas_api.dto.*;
import com.benfica.encomendas_api.model.*;
import com.benfica.encomendas_api.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ChatService {

    @Autowired
    private ConversaRepository conversaRepository;

    @Autowired
    private MensagemChatRepository mensagemChatRepository;

    @Autowired
    private LeituraMensagemRepository leituraMensagemRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private EquipeRepository equipeRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Transactional(readOnly = true)
    public List<ConversaDTO> getConversasDoUsuario(String equipeId, Long userId) {
        UUID equipeUuid = UUID.fromString(equipeId);
        List<Conversa> conversas = conversaRepository.findAllForUser(equipeUuid, userId);
        return conversas.stream()
                .map(c -> toConversaDTO(c, userId))
                .collect(Collectors.toList());
    }

    @Transactional
    public Conversa getOrCreateGrupo(String equipeId) {
        UUID equipeUuid = UUID.fromString(equipeId);
        return conversaRepository.findByEquipeIdAndTipo(equipeUuid, TipoConversa.GRUPO)
                .orElseGet(() -> {
                    Equipe equipe = equipeRepository.findById(equipeUuid)
                            .orElseThrow(() -> new RuntimeException("Equipe não encontrada: " + equipeId));
                    Conversa grupo = Conversa.builder()
                            .tipo(TipoConversa.GRUPO)
                            .equipe(equipe)
                            .nomeGrupo(equipe.getNome())
                            .build();
                    return conversaRepository.save(grupo);
                });
    }

    @Transactional
    public Conversa getOrCreatePrivado(String equipeId, Long userId, Long destinatarioId) {
        UUID equipeUuid = UUID.fromString(equipeId);
        return conversaRepository.findPrivado(equipeUuid, userId, destinatarioId)
                .orElseGet(() -> {
                    Equipe equipe = equipeRepository.findById(equipeUuid)
                            .orElseThrow(() -> new RuntimeException("Equipe não encontrada: " + equipeId));
                    Usuario userA = usuarioRepository.findById(userId)
                            .orElseThrow(() -> new RuntimeException("Usuário não encontrado: " + userId));
                    Usuario userB = usuarioRepository.findById(destinatarioId)
                            .orElseThrow(() -> new RuntimeException("Usuário não encontrado: " + destinatarioId));
                    Conversa privado = Conversa.builder()
                            .tipo(TipoConversa.PRIVADO)
                            .equipe(equipe)
                            .participanteA(userA)
                            .participanteB(userB)
                            .build();
                    return conversaRepository.save(privado);
                });
    }

    @Transactional(readOnly = true)
    public List<MensagemChatDTO> getMensagens(UUID conversaId, int page) {
        Page<MensagemChat> pagina = mensagemChatRepository
                .findByConversaIdAndDeletadaFalseOrderByEnviadoEmDesc(
                        conversaId, PageRequest.of(page, 30));
        List<MensagemChatDTO> lista = pagina.getContent().stream()
                .map(this::toMensagemDTO)
                .collect(Collectors.toList());
        Collections.reverse(lista);
        return lista;
    }

    @Transactional
    public MensagemChatDTO enviarMensagem(EnviarMensagemRequest req, Long remetenteId) {
        Conversa conversa = conversaRepository.findById(req.getConversaId())
                .orElseThrow(() -> new RuntimeException("Conversa não encontrada: " + req.getConversaId()));
        Usuario remetente = usuarioRepository.findById(remetenteId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado: " + remetenteId));

        MensagemChat mensagem = MensagemChat.builder()
                .conversa(conversa)
                .remetente(remetente)
                .conteudo(req.getConteudo())
                .deletada(false)
                .build();

        if (req.getUrlsAnexos() != null && !req.getUrlsAnexos().isEmpty()) {
            List<MensagemAnexo> anexos = req.getUrlsAnexos().stream()
                    .map(a -> MensagemAnexo.builder()
                            .nomeArquivo(a.getNomeArquivo())
                            .tipoArquivo(TipoAnexo.valueOf(a.getTipoArquivo()))
                            .url(a.getUrl())
                            .mensagem(mensagem)
                            .build())
                    .collect(Collectors.toList());
            mensagem.setAnexos(anexos);
        } else {
            mensagem.setAnexos(new ArrayList<>());
        }

        MensagemChat saved = mensagemChatRepository.save(mensagem);
        MensagemChatDTO dto = toMensagemDTO(saved);

        if (conversa.getTipo() == TipoConversa.GRUPO) {
            messagingTemplate.convertAndSend("/topic/chat." + conversa.getId(), dto);
        } else {
            Long destinatarioId = conversa.getParticipanteA().getId().equals(remetenteId)
                    ? conversa.getParticipanteB().getId()
                    : conversa.getParticipanteA().getId();
            messagingTemplate.convertAndSendToUser(
                    destinatarioId.toString(), "/queue/chat", dto);
            // Also send back to sender's queue so their own UI updates
            messagingTemplate.convertAndSendToUser(
                    remetenteId.toString(), "/queue/chat", dto);
        }

        pushBadgeUpdate(conversa, remetenteId);

        return dto;
    }

    @Transactional
    public void marcarLida(UUID conversaId, Long userId) {
        Conversa conversa = conversaRepository.findById(conversaId)
                .orElseThrow(() -> new RuntimeException("Conversa não encontrada: " + conversaId));
        Usuario usuario = usuarioRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado: " + userId));

        LeituraMensagem leitura = leituraMensagemRepository
                .findByConversaIdAndUsuarioId(conversaId, userId)
                .orElseGet(() -> LeituraMensagem.builder()
                        .conversa(conversa)
                        .usuario(usuario)
                        .build());
        leitura.setUltimoVistoEm(LocalDateTime.now());
        leituraMensagemRepository.save(leitura);

        long total = mensagemChatRepository.countTotalUnread(conversa.getEquipe().getId(), userId);
        messagingTemplate.convertAndSendToUser(userId.toString(), "/queue/badge", total);
    }

    @Transactional(readOnly = true)
    public long getTotalNaoLidas(String equipeId, Long userId) {
        return mensagemChatRepository.countTotalUnread(UUID.fromString(equipeId), userId);
    }

    private void pushBadgeUpdate(Conversa conversa, Long remetenteId) {
        if (conversa.getTipo() != TipoConversa.GRUPO) {
            Long otherUserId = conversa.getParticipanteA().getId().equals(remetenteId)
                    ? conversa.getParticipanteB().getId()
                    : conversa.getParticipanteA().getId();
            long total = mensagemChatRepository.countTotalUnread(conversa.getEquipe().getId(), otherUserId);
            messagingTemplate.convertAndSendToUser(otherUserId.toString(), "/queue/badge", total);
        }
    }

    private ConversaDTO toConversaDTO(Conversa c, Long userId) {
        String nomeExibicao;
        Long outroUsuarioId = null;

        if (c.getTipo() == TipoConversa.GRUPO) {
            nomeExibicao = c.getNomeGrupo() != null ? c.getNomeGrupo() : "Grupo";
        } else {
            Usuario outro = c.getParticipanteA().getId().equals(userId)
                    ? c.getParticipanteB()
                    : c.getParticipanteA();
            nomeExibicao = outro.getNomeCompleto();
            outroUsuarioId = outro.getId();
        }

        List<String> ultimasList = mensagemChatRepository.findUltimasMensagensConteudo(
                c.getId(), PageRequest.of(0, 1));
        String ultimaMensagem = ultimasList.isEmpty() ? null : ultimasList.get(0);
        LocalDateTime ultimaMensagemEm = mensagemChatRepository.findUltimaMensagemEm(c.getId());

        LocalDateTime ultimoVisto = leituraMensagemRepository
                .findByConversaIdAndUsuarioId(c.getId(), userId)
                .map(LeituraMensagem::getUltimoVistoEm)
                .orElse(LocalDateTime.of(1970, 1, 1, 0, 0));

        long naoLidas = mensagemChatRepository.countUnreadInConversa(c.getId(), ultimoVisto, userId);

        return ConversaDTO.builder()
                .id(c.getId())
                .tipo(c.getTipo().name())
                .nomeExibicao(nomeExibicao)
                .outroUsuarioId(outroUsuarioId)
                .ultimaMensagem(ultimaMensagem)
                .ultimaMensagemEm(ultimaMensagemEm)
                .naoLidas(naoLidas)
                .build();
    }

    private MensagemChatDTO toMensagemDTO(MensagemChat m) {
        List<MensagemAnexoDTO> anexos = m.getAnexos() != null
                ? m.getAnexos().stream()
                    .map(a -> MensagemAnexoDTO.builder()
                            .id(a.getId())
                            .nomeArquivo(a.getNomeArquivo())
                            .tipoArquivo(a.getTipoArquivo().name())
                            .url(a.getUrl())
                            .build())
                    .collect(Collectors.toList())
                : new ArrayList<>();

        return MensagemChatDTO.builder()
                .id(m.getId())
                .conversaId(m.getConversa().getId())
                .remetenteId(m.getRemetente().getId())
                .remetenteNome(m.getRemetente().getNomeCompleto())
                .conteudo(m.getConteudo())
                .enviadoEm(m.getEnviadoEm())
                .deletada(m.isDeletada())
                .anexos(anexos)
                .build();
    }
}
