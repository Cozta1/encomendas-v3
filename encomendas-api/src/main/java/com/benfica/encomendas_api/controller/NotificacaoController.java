package com.benfica.encomendas_api.controller;

import com.benfica.encomendas_api.dto.NotificacaoDTO;
import com.benfica.encomendas_api.dto.NotificacaoRequestDTO;
import com.benfica.encomendas_api.service.NotificacaoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notificacoes")
public class NotificacaoController {

    @Autowired
    private NotificacaoService notificacaoService;

    @GetMapping
    public ResponseEntity<List<NotificacaoDTO>> getNotificacoes(@RequestParam Long usuarioId) {
        return ResponseEntity.ok(notificacaoService.getNotificacoes(usuarioId));
    }

    @GetMapping("/count")
    public ResponseEntity<Long> getContadorNaoLidas(@RequestParam Long usuarioId) {
        return ResponseEntity.ok(notificacaoService.getContadorNaoLidas(usuarioId));
    }

    @PostMapping("/enviar")
    public ResponseEntity<Void> enviarNotificacao(@RequestBody NotificacaoRequestDTO request) {
        notificacaoService.enviarNotificacao(
                request.getEquipeId(),
                request.getDestinatarioId(),
                request.getRemetenteId(),
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
    public ResponseEntity<Void> marcarTodasLidas(@RequestParam Long usuarioId) {
        notificacaoService.marcarTodasLidas(usuarioId);
        return ResponseEntity.ok().build();
    }
}
