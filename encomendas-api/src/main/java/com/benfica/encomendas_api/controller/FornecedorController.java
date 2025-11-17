package com.benfica.encomendas_api.controller;

import com.benfica.encomendas_api.dto.FornecedorRequestDTO;
import com.benfica.encomendas_api.dto.FornecedorResponseDTO;
import com.benfica.encomendas_api.security.TeamContextHolder;
import com.benfica.encomendas_api.service.FornecedorService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/fornecedores")
public class FornecedorController {

    @Autowired
    private FornecedorService fornecedorService;

    @GetMapping
    public ResponseEntity<List<FornecedorResponseDTO>> listarFornecedoresPorEquipe() {
        UUID equipeId = TeamContextHolder.getTeamId();
        List<FornecedorResponseDTO> dtos = fornecedorService.listarFornecedoresPorEquipe(equipeId);
        return ResponseEntity.ok(dtos);
    }

    // --- NOVO ENDPOINT (SEARCH) ---
    @GetMapping("/search")
    public ResponseEntity<List<FornecedorResponseDTO>> searchFornecedores(
            @RequestParam("nome") String nome) {

        UUID equipeId = TeamContextHolder.getTeamId();
        if (nome == null || nome.trim().isEmpty()) {
            return listarFornecedoresPorEquipe();
        }
        List<FornecedorResponseDTO> dtos = fornecedorService.searchFornecedoresPorNome(nome, equipeId);
        return ResponseEntity.ok(dtos);
    }

    @PostMapping
    public ResponseEntity<FornecedorResponseDTO> criarFornecedor(@Valid @RequestBody FornecedorRequestDTO dto) {
        UUID equipeId = TeamContextHolder.getTeamId();
        FornecedorResponseDTO novoDTO = fornecedorService.criarFornecedor(dto, equipeId);
        return new ResponseEntity<>(novoDTO, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<FornecedorResponseDTO> atualizarFornecedor(
            @PathVariable UUID id,
            @Valid @RequestBody FornecedorRequestDTO dto) {

        UUID equipeId = TeamContextHolder.getTeamId();
        FornecedorResponseDTO dtoAtualizado = fornecedorService.atualizarFornecedor(id, dto, equipeId);
        return ResponseEntity.ok(dtoAtualizado);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removerFornecedor(@PathVariable UUID id) {
        UUID equipeId = TeamContextHolder.getTeamId();
        fornecedorService.removerFornecedor(id, equipeId);
        return ResponseEntity.noContent().build();
    }
}