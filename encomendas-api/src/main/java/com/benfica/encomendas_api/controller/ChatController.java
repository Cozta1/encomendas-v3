package com.benfica.encomendas_api.controller;

import com.benfica.encomendas_api.dto.*;
import com.benfica.encomendas_api.model.Conversa;
import com.benfica.encomendas_api.model.TipoAnexo;
import com.benfica.encomendas_api.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private ChatService chatService;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @GetMapping("/conversas")
    public ResponseEntity<List<ConversaDTO>> getConversas(
            @RequestParam String equipeId,
            @RequestParam Long usuarioId) {
        return ResponseEntity.ok(chatService.getConversasDoUsuario(equipeId, usuarioId));
    }

    @PostMapping("/conversas")
    public ResponseEntity<Map<String, Object>> criarConversa(
            @RequestBody CriarConversaRequest req,
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
    public ResponseEntity<MensagemAnexoDTO> uploadAnexo(@RequestParam("file") MultipartFile file) throws IOException {
        String originalFilename = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
        String nomeArquivo = UUID.randomUUID() + "_" + originalFilename;

        Path uploadPath = Paths.get(uploadDir, "chat");
        Files.createDirectories(uploadPath);

        Path filePath = uploadPath.resolve(nomeArquivo);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        String contentType = file.getContentType() != null ? file.getContentType() : "";
        TipoAnexo tipoAnexo;
        if (contentType.startsWith("image/")) {
            tipoAnexo = TipoAnexo.IMG;
        } else if (contentType.equals("application/pdf")) {
            tipoAnexo = TipoAnexo.PDF;
        } else {
            tipoAnexo = TipoAnexo.DOC;
        }

        String url = "/uploads/chat/" + nomeArquivo;

        return ResponseEntity.ok(MensagemAnexoDTO.builder()
                .nomeArquivo(originalFilename)
                .tipoArquivo(tipoAnexo.name())
                .url(url)
                .build());
    }

    @PostMapping("/mensagens/{conversaId}/lida")
    public ResponseEntity<Void> marcarLida(
            @PathVariable UUID conversaId,
            @RequestParam Long usuarioId) {
        chatService.marcarLida(conversaId, usuarioId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/badge")
    public ResponseEntity<Long> getBadge(
            @RequestParam String equipeId,
            @RequestParam Long usuarioId) {
        return ResponseEntity.ok(chatService.getTotalNaoLidas(equipeId, usuarioId));
    }

    private Long getUserIdFromPrincipal(UserDetails userDetails) {
        if (userDetails instanceof com.benfica.encomendas_api.model.Usuario u) {
            return u.getId();
        }
        throw new RuntimeException("Não foi possível obter o ID do usuário autenticado");
    }
}
