package com.benfica.encomendas_api.controller;

import com.benfica.encomendas_api.dto.FornecedorRequestDTO;
import com.benfica.encomendas_api.dto.FornecedorResponseDTO;
import com.benfica.encomendas_api.service.FornecedorService;
import com.benfica.encomendas_api.security.TeamContextHolder; // Ajuste o import se o seu pacote for com _
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

    /**
     * Endpoint para listar todos os fornecedores da equipe ativa (vinda do context).
     */
    @GetMapping
    public ResponseEntity<List<FornecedorResponseDTO>> listarFornecedores() {
        // Pega o ID da equipe do ThreadLocal (preenchido pelo TeamContextFilter)
        UUID equipeId = TeamContextHolder.getTeamId();

        List<FornecedorResponseDTO> dtos = fornecedorService.listarFornecedoresPorEquipe(equipeId);
        return ResponseEntity.ok(dtos);
    }

    /**
     * Endpoint para criar um novo fornecedor para a equipe ativa (vinda do context).
     */
    @PostMapping
    public ResponseEntity<FornecedorResponseDTO> criarFornecedor(@Valid @RequestBody FornecedorRequestDTO dto) {
        // Pega o ID da equipe do ThreadLocal
        UUID equipeId = TeamContextHolder.getTeamId();

        FornecedorResponseDTO novoFornecedor = fornecedorService.criarFornecedor(dto, equipeId);
        return new ResponseEntity<>(novoFornecedor, HttpStatus.CREATED);
    }
}