package com.benfica.encomendas_api.controller;

import com.benfica.encomendas_api.dto.EscalaReplicacaoDTO; // Import novo
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

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EscalaTrabalhoDTO> salvarEscala(@RequestBody EscalaTrabalhoDTO dto) {
        EscalaTrabalhoDTO salva = escalaService.salvarEscala(dto);
        return ResponseEntity.ok(salva);
    }

    // --- NOVO ENDPOINT ---
    @PostMapping("/replicar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> replicarEscala(@RequestBody EscalaReplicacaoDTO dto) {
        escalaService.replicarEscala(dto);
        return ResponseEntity.ok().build();
    }
    // ---------------------

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