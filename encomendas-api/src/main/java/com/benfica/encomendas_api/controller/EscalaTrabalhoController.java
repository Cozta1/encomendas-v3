package com.benfica.encomendas_api.controller;

import com.benfica.encomendas_api.dto.EscalaTrabalhoDTO;
import com.benfica.encomendas_api.service.EscalaTrabalhoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/escala")
public class EscalaTrabalhoController {

    @Autowired
    private EscalaTrabalhoService escalaService;

    // --- 1. Definir/Atualizar Escala (Apenas ADMIN) ---
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EscalaTrabalhoDTO> salvarEscala(@RequestBody EscalaTrabalhoDTO dto) {
        EscalaTrabalhoDTO salva = escalaService.salvarEscala(dto);
        return ResponseEntity.ok(salva);
    }

    // --- 2. Buscar Escala por Período ---
    // Exemplo de chamada: GET /api/escala?usuarioId=1&inicio=2025-01-01&fim=2025-01-31
    @GetMapping
    public ResponseEntity<List<EscalaTrabalhoDTO>> buscarEscala(
            @RequestParam Long usuarioId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim
    ) {
        List<EscalaTrabalhoDTO> escalas = escalaService.buscarEscalaPorPeriodo(usuarioId, inicio, fim);
        return ResponseEntity.ok(escalas);
    }
}