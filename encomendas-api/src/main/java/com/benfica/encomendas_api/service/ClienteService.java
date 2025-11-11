package com.benfica.encomendas_api.service;

import com.benfica.encomendas_api.dto.ClienteRequestDTO;
import com.benfica.encomendas_api.dto.ClienteResponseDTO;
import com.benfica.encomendas_api.model.Cliente;
import com.benfica.encomendas_api.model.Equipe;
import com.benfica.encomendas_api.repository.ClienteRepository;
import com.benfica.encomendas_api.repository.EquipeRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ClienteService {

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private EquipeRepository equipeRepository;

    /**
     * Lista todos os clientes filtrados pelo ID da equipe.
     */
    @Transactional(readOnly = true)
    public List<ClienteResponseDTO> listarClientesPorEquipe(UUID equipeId) {
        List<Cliente> clientes = clienteRepository.findByEquipeId(equipeId);
        return clientes.stream()
                .map(ClienteResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Cria um novo cliente associado à equipe fornecida.
     */
    @Transactional
    public ClienteResponseDTO criarCliente(ClienteRequestDTO dto, UUID equipeId) {
        // 1. Busca a equipe ou lança exceção
        Equipe equipe = equipeRepository.findById(equipeId)
                .orElseThrow(() -> new EntityNotFoundException("Equipe não encontrada com ID: " + equipeId));

        // 2. Constrói o novo cliente
        Cliente novoCliente = Cliente.builder()
                .nome(dto.getNome())
                .telefone(dto.getTelefone())
                .email(dto.getEmail())
                .cpfCnpj(dto.getCpfCnpj())
                .endereco(dto.getEndereco())
                .equipe(equipe) // Associa a equipe
                .build();

        // 3. Salva no banco
        Cliente clienteSalvo = clienteRepository.save(novoCliente);

        // 4. Retorna o DTO de resposta
        return ClienteResponseDTO.fromEntity(clienteSalvo);
    }
}