package com.benfica.encomendas_api.controller;

import com.benfica.encomendas_api.dto.ClienteRequestDTO;
import com.benfica.encomendas_api.dto.ClienteResponseDTO;
import com.benfica.encomendas_api.security.TeamContextHolder;
import com.benfica.encomendas_api.service.ClienteService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/clientes")
public class ClienteController {

    @Autowired
    private ClienteService clienteService;

    @GetMapping
    public ResponseEntity<List<ClienteResponseDTO>> listarClientesPorEquipe() {
        UUID equipeId = TeamContextHolder.getTeamId();
        List<ClienteResponseDTO> dtos = clienteService.listarClientesPorEquipe(equipeId);
        return ResponseEntity.ok(dtos);
    }

    // --- NOVO ENDPOINT (SEARCH) ---
    @GetMapping("/search")
    public ResponseEntity<List<ClienteResponseDTO>> searchClientes(
            @RequestParam("nome") String nome) {

        UUID equipeId = TeamContextHolder.getTeamId();
        // Se a busca for vazia, retorna todos (ou pode mudar a lógica)
        if (nome == null || nome.trim().isEmpty()) {
            return listarClientesPorEquipe();
        }
        List<ClienteResponseDTO> dtos = clienteService.searchClientesPorNome(nome, equipeId);
        return ResponseEntity.ok(dtos);
    }

    @PostMapping
    public ResponseEntity<ClienteResponseDTO> criarCliente(@Valid @RequestBody ClienteRequestDTO dto) {
        UUID equipeId = TeamContextHolder.getTeamId();
        ClienteResponseDTO novoDTO = clienteService.criarCliente(dto, equipeId);
        return new ResponseEntity<>(novoDTO, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClienteResponseDTO> atualizarCliente(
            @PathVariable UUID id,
            @Valid @RequestBody ClienteRequestDTO dto) {

        UUID equipeId = TeamContextHolder.getTeamId();
        ClienteResponseDTO dtoAtualizado = clienteService.atualizarCliente(id, dto, equipeId);
        return ResponseEntity.ok(dtoAtualizado);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removerCliente(@PathVariable UUID id) {
        UUID equipeId = TeamContextHolder.getTeamId();
        clienteService.removerCliente(id, equipeId);
        return ResponseEntity.noContent().build();
    }
}