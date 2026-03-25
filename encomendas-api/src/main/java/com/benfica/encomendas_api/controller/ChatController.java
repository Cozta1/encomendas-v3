package com.benfica.encomendas_api.controller;

import com.benfica.encomendas_api.dto.*;
import com.benfica.encomendas_api.model.Conversa;
import com.benfica.encomendas_api.service.ChatService;
import com.benfica.encomendas_api.service.FileUploadService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private static final Logger logger = LoggerFactory.getLogger(ChatController.class);

    @Autowired
    private ChatService chatService;

    @Autowired
    private FileUploadService fileUploadService;

    /**
     * SECURITY FIX (OWASP A01 — IDOR): removed @RequestParam usuarioId.
     * The user's ID is now always read from the authenticated principal.
     */
    @GetMapping("/conversas")
    public ResponseEntity<List<ConversaDTO>> getConversas(
            @RequestParam String equipeId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long usuarioId = getUserIdFromPrincipal(userDetails);
        return ResponseEntity.ok(chatService.getConversasDoUsuario(equipeId, usuarioId));
    }

    @PostMapping("/conversas")
    public ResponseEntity<Map<String, Object>> criarConversa(
            @Valid @RequestBody CriarConversaRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        Conversa conversa;
        if (req.getDestinatarioId() == null) {
            conversa = chatService.getOrCreateGrupo(req.getEquipeId());
        } else {
            Long requesterId = getUserIdFromPrincipal(userDetails);
            conversa = chatService.getOrCreatePrivado(req.getEquipeId(), requesterId, req.getDestinatarioId());
        }
        Map<String, Object> resp = new HashMap<>();
        resp.put("id", conversa.getId());
        resp.put("tipo", conversa.getTipo().name());
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/mensagens")
    public ResponseEntity<List<MensagemChatDTO>> getMensagens(
            @RequestParam UUID conversaId,
            @RequestParam(defaultValue = "0") int page) {
        return ResponseEntity.ok(chatService.getMensagens(conversaId, page));
    }

    @PostMapping("/mensagens/upload")
    public ResponseEntity<?> uploadAnexo(@RequestParam("file") MultipartFile file) {
        try {
            MensagemAnexoDTO resultado = fileUploadService.uploadChatFile(file);
            return ResponseEntity.ok(resultado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (IOException e) {
            logger.error("Erro ao guardar ficheiro", e);
            return ResponseEntity.internalServerError().body("Erro ao guardar ficheiro.");
        }
    }

    /** SECURITY FIX (IDOR): replaced @RequestParam usuarioId with authenticated principal. */
    @PostMapping("/mensagens/{conversaId}/lida")
    public ResponseEntity<Void> marcarLida(
            @PathVariable UUID conversaId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long usuarioId = getUserIdFromPrincipal(userDetails);
        chatService.marcarLida(conversaId, usuarioId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/mensagens/enviar")
    public ResponseEntity<MensagemChatDTO> enviarMensagem(
            @Valid @RequestBody EnviarMensagemRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserIdFromPrincipal(userDetails);
        MensagemChatDTO dto = chatService.enviarMensagem(req, userId);
        return ResponseEntity.ok(dto);
    }

    /** SECURITY FIX (IDOR): replaced @RequestParam usuarioId with authenticated principal. */
    @GetMapping("/badge")
    public ResponseEntity<Long> getBadge(
            @RequestParam String equipeId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long usuarioId = getUserIdFromPrincipal(userDetails);
        return ResponseEntity.ok(chatService.getTotalNaoLidas(equipeId, usuarioId));
    }

    private Long getUserIdFromPrincipal(UserDetails userDetails) {
        if (userDetails instanceof com.benfica.encomendas_api.model.Usuario u) {
            return u.getId();
        }
        throw new RuntimeException("Não foi possível obter o ID do usuário autenticado");
    }
}
