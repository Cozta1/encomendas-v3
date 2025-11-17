package com.benfica.encomendas_api.service;

import com.benfica.encomendas_api.dto.ClienteRequestDTO;
import com.benfica.encomendas_api.dto.ClienteResponseDTO;
import com.benfica.encomendas_api.model.Cliente;
import com.benfica.encomendas_api.model.Equipe;
import com.benfica.encomendas_api.repository.ClienteRepository;
import com.benfica.encomendas_api.repository.EquipeRepository;
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

    @Transactional(readOnly = true)
    public List<ClienteResponseDTO> listarClientesPorEquipe(UUID equipeId) {
        return clienteRepository.findByEquipeId(equipeId).stream()
                .map(this::paraResponseDTO)
                .collect(Collectors.toList());
    }

    // --- NOVO MÉTODO (SEARCH) ---
    @Transactional(readOnly = true)
    public List<ClienteResponseDTO> searchClientesPorNome(String nome, UUID equipeId) {
        return clienteRepository.findByEquipeIdAndNomeContainingIgnoreCase(equipeId, nome)
                .stream()
                .map(this::paraResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ClienteResponseDTO criarCliente(ClienteRequestDTO dto, UUID equipeId) {
        Equipe equipe = equipeRepository.findById(equipeId)
                .orElseThrow(() -> new RuntimeException("Equipe não encontrada"));

        Cliente cliente = Cliente.builder()
                .nome(dto.getNome())
                .telefone(dto.getTelefone())
                .email(dto.getEmail())
                .cpfCnpj(dto.getCpfCnpj())
                .endereco(dto.getEndereco())
                .equipe(equipe)
                .build();

        Cliente salvo = clienteRepository.save(cliente);
        return paraResponseDTO(salvo);
    }

    @Transactional
    public ClienteResponseDTO atualizarCliente(UUID id, ClienteRequestDTO dto, UUID equipeId) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cliente não encontrado com ID: " + id));

        if (!cliente.getEquipe().getId().equals(equipeId)) {
            throw new RuntimeException("Acesso negado: Este cliente não pertence à sua equipe.");
        }

        cliente.setNome(dto.getNome());
        cliente.setTelefone(dto.getTelefone());
        cliente.setEmail(dto.getEmail());
        cliente.setCpfCnpj(dto.getCpfCnpj());
        cliente.setEndereco(dto.getEndereco());

        Cliente atualizado = clienteRepository.save(cliente);
        return paraResponseDTO(atualizado);
    }

    @Transactional
    public void removerCliente(UUID id, UUID equipeId) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cliente não encontrado com ID: " + id));

        if (!cliente.getEquipe().getId().equals(equipeId)) {
            throw new RuntimeException("Acesso negado: Este cliente não pertence à sua equipe.");
        }

        clienteRepository.delete(cliente);
    }

    private ClienteResponseDTO paraResponseDTO(Cliente cliente) {
        return ClienteResponseDTO.builder()
                .id(cliente.getId())
                .nome(cliente.getNome())
                .telefone(cliente.getTelefone())
                .email(cliente.getEmail())
                .cpfCnpj(cliente.getCpfCnpj())
                .endereco(cliente.getEndereco())
                .build();
    }
}