package com.benfica.encomendas_api.controller;

import com.benfica.encomendas_api.dto.ProdutoRequestDTO;
import com.benfica.encomendas_api.dto.ProdutoResponseDTO;
import com.benfica.encomendas_api.security.TeamContextHolder;
import com.benfica.encomendas_api.service.ProdutoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/produtos")
public class ProdutoController {

    @Autowired
    private ProdutoService produtoService;

    @GetMapping
    public ResponseEntity<List<ProdutoResponseDTO>> listarProdutosPorEquipe() {
        UUID equipeId = TeamContextHolder.getTeamId();
        List<ProdutoResponseDTO> dtos = produtoService.listarProdutosPorEquipe(equipeId);
        return ResponseEntity.ok(dtos);
    }

    // --- NOVO ENDPOINT (SEARCH) ---
    @GetMapping("/search")
    public ResponseEntity<List<ProdutoResponseDTO>> searchProdutos(
            @RequestParam("nome") String nome) {

        UUID equipeId = TeamContextHolder.getTeamId();
        if (nome == null || nome.trim().isEmpty()) {
            return listarProdutosPorEquipe();
        }
        List<ProdutoResponseDTO> dtos = produtoService.searchProdutosPorNome(nome, equipeId);
        return ResponseEntity.ok(dtos);
    }

    @PostMapping
    public ResponseEntity<ProdutoResponseDTO> criarProduto(@Valid @RequestBody ProdutoRequestDTO dto) {
        UUID equipeId = TeamContextHolder.getTeamId();
        ProdutoResponseDTO novoDTO = produtoService.criarProduto(dto, equipeId);
        return new ResponseEntity<>(novoDTO, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProdutoResponseDTO> atualizarProduto(
            @PathVariable UUID id,
            @Valid @RequestBody ProdutoRequestDTO dto) {

        UUID equipeId = TeamContextHolder.getTeamId();
        ProdutoResponseDTO dtoAtualizado = produtoService.atualizarProduto(id, dto, equipeId);
        return ResponseEntity.ok(dtoAtualizado);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removerProduto(@PathVariable UUID id) {
        UUID equipeId = TeamContextHolder.getTeamId();
        produtoService.removerProduto(id, equipeId);
        return ResponseEntity.noContent().build();
    }
}