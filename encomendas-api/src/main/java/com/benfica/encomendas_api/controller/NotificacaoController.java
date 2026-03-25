package com.benfica.encomendas_api.controller;

import com.benfica.encomendas_api.dto.NotificacaoDTO;
import com.benfica.encomendas_api.dto.NotificacaoRequestDTO;
import com.benfica.encomendas_api.model.Usuario;
import com.benfica.encomendas_api.service.NotificacaoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notificacoes")
public class NotificacaoController {

    @Autowired
    private NotificacaoService notificacaoService;

    /**
     * SECURITY FIX (OWASP A01 — Broken Access Control / IDOR):
     * Previously accepted userId as a request param, allowing any authenticated user
     * to read any other user's notifications. Now the userId is always derived from
     * the authenticated principal, ensuring users can only access their own data.
     */
    @GetMapping
    public ResponseEntity<List<NotificacaoDTO>> getNotificacoes(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long usuarioId = getUserId(userDetails);
        return ResponseEntity.ok(notificacaoService.getNotificacoes(usuarioId));
    }

    @GetMapping("/count")
    public ResponseEntity<Long> getContadorNaoLidas(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long usuarioId = getUserId(userDetails);
        return ResponseEntity.ok(notificacaoService.getContadorNaoLidas(usuarioId));
    }

    @PostMapping("/enviar")
    public ResponseEntity<Void> enviarNotificacao(
            @Valid @RequestBody NotificacaoRequestDTO request,
            @AuthenticationPrincipal UserDetails userDetails) {
        // SECURITY FIX: ignore request.getRemetenteId() — always use the authenticated
        // user's ID as the sender to prevent sender impersonation
        Long remetenteId = getUserId(userDetails);
        notificacaoService.enviarNotificacao(
                request.getEquipeId(),
                request.getDestinatarioId(),
                remetenteId,
                request.getTitulo(),
                request.getMensagem()
        );
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/ler")
    public ResponseEntity<Void> marcarLida(@PathVariable UUID id) {
        notificacaoService.marcarLida(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/ler-todas")
    public ResponseEntity<Void> marcarTodasLidas(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long usuarioId = getUserId(userDetails);
        notificacaoService.marcarTodasLidas(usuarioId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/limpar")
    public ResponseEntity<Void> limparNotificacoes(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long usuarioId = getUserId(userDetails);
        notificacaoService.limparNotificacoes(usuarioId);
        return ResponseEntity.noContent().build();
    }

    private Long getUserId(UserDetails userDetails) {
        if (userDetails instanceof Usuario u) {
            return u.getId();
        }
        throw new RuntimeException("Não foi possível obter o ID do usuário autenticado");
    }
}
