package com.benfica.encomendas_api.controller;

import com.benfica.encomendas_api.dto.ClienteRequestDTO;
import com.benfica.encomendas_api.dto.ClienteResponseDTO;
import com.benfica.encomendas_api.service.ClienteService;
import com.benfica.encomendas_api.security.TeamContextHolder;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/clientes")
public class ClienteController {

    @Autowired
    private ClienteService clienteService;

    /**
     * Lista todos os clientes da equipe atualmente selecionada no contexto.
     */
    @GetMapping
    public ResponseEntity<List<ClienteResponseDTO>> listarClientes() {
        UUID equipeId = getEquipeIdDoContexto();
        List<ClienteResponseDTO> dtos = clienteService.listarClientesPorEquipe(equipeId);
        return ResponseEntity.ok(dtos);
    }

    /**
     * Cria um novo cliente para a equipe atualmente selecionada no contexto.
     */
    @PostMapping
    public ResponseEntity<ClienteResponseDTO> criarCliente(@Valid @RequestBody ClienteRequestDTO dto) {
        UUID equipeId = getEquipeIdDoContexto();
        ClienteResponseDTO dtoSalvo = clienteService.criarCliente(dto, equipeId);
        return new ResponseEntity<>(dtoSalvo, HttpStatus.CREATED);
    }

    /**
     * Método helper para extrair o ID da equipe do ThreadLocal
     * e lançar uma exceção 400 (Bad Request) se não estiver definido.
     */
    private UUID getEquipeIdDoContexto() {
        UUID equipeId = TeamContextHolder.getTeamId();
        if (equipeId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nenhuma equipe selecionada. Defina o header X-Team-ID.");
        }
        return equipeId;
    }
}