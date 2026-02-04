package com.benfica.encomendas_api.controller;

import com.benfica.encomendas_api.dto.EscalaReplicacaoDTO;
import com.benfica.encomendas_api.dto.EscalaTrabalhoDTO;
import com.benfica.encomendas_api.service.EscalaTrabalhoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/escalas")
public class EscalaTrabalhoController {

    @Autowired
    private EscalaTrabalhoService escalaService;

    @GetMapping
    public ResponseEntity<List<EscalaTrabalhoDTO>> getEscalas(
            @RequestParam Long usuarioId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {

        List<EscalaTrabalhoDTO> escalas = escalaService.getEscalas(usuarioId, inicio, fim);
        return ResponseEntity.ok(escalas);
    }

    @PostMapping
    public ResponseEntity<EscalaTrabalhoDTO> salvarEscala(@RequestBody EscalaTrabalhoDTO dto) {
        EscalaTrabalhoDTO salva = escalaService.salvarEscala(dto);
        return ResponseEntity.ok(salva);
    }

    @PostMapping("/replicar")
    public ResponseEntity<Void> replicarEscala(@RequestBody EscalaReplicacaoDTO dto) {
        escalaService.replicarEscala(dto);
        return ResponseEntity.ok().build();
    }
}