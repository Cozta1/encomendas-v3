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
import org.springframework.web.server.ResponseStatusException;

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
        if (equipeId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sessão inválida. Faça login novamente.");
        }
        List<EncomendaResponseDTO> dtos = encomendaService.listarEncomendasPorEquipe(equipeId);
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EncomendaResponseDTO> buscarPorId(@PathVariable UUID id) {
        UUID equipeId = TeamContextHolder.getTeamId();
        if (equipeId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sessão inválida.");
        }
        EncomendaResponseDTO dto = encomendaService.buscarPorId(id, equipeId);
        return ResponseEntity.ok(dto);
    }

    @PostMapping
    public ResponseEntity<EncomendaResponseDTO> criarEncomenda(@Valid @RequestBody EncomendaRequestDTO dto) {
        UUID equipeId = TeamContextHolder.getTeamId();
        if (equipeId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sessão inválida ou expirada.");
        }

        EncomendaResponseDTO novaDTO = encomendaService.criarEncomenda(dto, equipeId);
        return new ResponseEntity<>(novaDTO, HttpStatus.CREATED);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removerEncomenda(@PathVariable UUID id) {
        UUID equipeId = TeamContextHolder.getTeamId();
        if (equipeId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);

        encomendaService.removerEncomenda(id, equipeId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/avancar")
    public ResponseEntity<EncomendaResponseDTO> avancarEtapa(@PathVariable UUID id) {
        UUID equipeId = TeamContextHolder.getTeamId();
        if (equipeId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);

        EncomendaResponseDTO dtoAtualizado = encomendaService.avancarEtapa(id, equipeId);
        return ResponseEntity.ok(dtoAtualizado);
    }

    @PatchMapping("/{id}/retornar")
    public ResponseEntity<EncomendaResponseDTO> retornarEtapa(@PathVariable UUID id) {
        UUID equipeId = TeamContextHolder.getTeamId();
        if (equipeId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);

        EncomendaResponseDTO dtoAtualizado = encomendaService.retornarEtapa(id, equipeId);
        return ResponseEntity.ok(dtoAtualizado);
    }

    @PatchMapping("/{id}/cancelar")
    public ResponseEntity<EncomendaResponseDTO> cancelarEncomenda(@PathVariable UUID id) {
        UUID equipeId = TeamContextHolder.getTeamId();
        if (equipeId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);

        EncomendaResponseDTO dtoAtualizado = encomendaService.cancelarEncomenda(id, equipeId);
        return ResponseEntity.ok(dtoAtualizado);
    }

    @PatchMapping("/{id}/descancelar")
    public ResponseEntity<EncomendaResponseDTO> descancelarEncomenda(@PathVariable UUID id) {
        UUID equipeId = TeamContextHolder.getTeamId();
        if (equipeId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);

        EncomendaResponseDTO dtoAtualizado = encomendaService.descancelarEncomenda(id, equipeId);
        return ResponseEntity.ok(dtoAtualizado);
    }
}