package com.benfica.encomendas_api.controller;

import com.benfica.encomendas_api.dto.EncomendaRequestDTO;
import com.benfica.encomendas_api.dto.EncomendaResponseDTO;
import com.benfica.encomendas_api.security.TeamContextHolder;
import com.benfica.encomendas_api.service.EncomendaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/encomendas")
public class EncomendaController {

    @Autowired
    private EncomendaService encomendaService;

    @GetMapping
    public ResponseEntity<List<EncomendaResponseDTO>> listarEncomendasPorEquipe() {
        UUID equipeId = TeamContextHolder.getTeamId();
        List<EncomendaResponseDTO> dtos = encomendaService.listarEncomendasPorEquipe(equipeId);
        return ResponseEntity.ok(dtos);
    }

    @PostMapping
    public ResponseEntity<EncomendaResponseDTO> criarEncomenda(@Valid @RequestBody EncomendaRequestDTO dto) {
        UUID equipeId = TeamContextHolder.getTeamId();
        EncomendaResponseDTO novaDTO = encomendaService.criarEncomenda(dto, equipeId);
        return new ResponseEntity<>(novaDTO, HttpStatus.CREATED);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removerEncomenda(@PathVariable UUID id) {
        UUID equipeId = TeamContextHolder.getTeamId();
        encomendaService.removerEncomenda(id, equipeId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/avancar")
    public ResponseEntity<EncomendaResponseDTO> avancarEtapa(@PathVariable UUID id) {
        UUID equipeId = TeamContextHolder.getTeamId();
        EncomendaResponseDTO dtoAtualizado = encomendaService.avancarEtapa(id, equipeId);
        return ResponseEntity.ok(dtoAtualizado);
    }

    @PatchMapping("/{id}/retornar")
    public ResponseEntity<EncomendaResponseDTO> retornarEtapa(@PathVariable UUID id) {
        UUID equipeId = TeamContextHolder.getTeamId();
        EncomendaResponseDTO dtoAtualizado = encomendaService.retornarEtapa(id, equipeId);
        return ResponseEntity.ok(dtoAtualizado);
    }

    // --- NOVO ENDPOINT ---
    @PatchMapping("/{id}/cancelar")
    public ResponseEntity<EncomendaResponseDTO> cancelarEncomenda(@PathVariable UUID id) {
        UUID equipeId = TeamContextHolder.getTeamId();
        EncomendaResponseDTO dtoAtualizado = encomendaService.cancelarEncomenda(id, equipeId);
        return ResponseEntity.ok(dtoAtualizado);
    }
}