package com.benfica.encomendas_api.service;

import com.benfica.encomendas_api.dto.ClienteRequestDTO;
import com.benfica.encomendas_api.dto.ClienteResponseDTO;
import com.benfica.encomendas_api.model.Cliente;
import com.benfica.encomendas_api.model.Endereco;
import com.benfica.encomendas_api.model.Equipe;
import com.benfica.encomendas_api.repository.ClienteRepository;
import com.benfica.encomendas_api.repository.EquipeRepository;
import com.benfica.encomendas_api.security.TeamContextHolder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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
                .map(ClienteResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ClienteResponseDTO> searchClientesPorNome(String nome, UUID equipeId) {
        return clienteRepository.findByEquipeIdAndNomeContainingIgnoreCase(equipeId, nome).stream()
                .map(ClienteResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public ClienteResponseDTO criarCliente(ClienteRequestDTO dto, UUID equipeId) {
        Equipe equipe = equipeRepository.findById(equipeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Equipe não encontrada"));

        if (clienteRepository.findByEquipeId(equipeId).stream()
                .anyMatch(c -> c.getEmail().equalsIgnoreCase(dto.getEmail()))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Já existe um cliente com este email.");
        }

        Cliente cliente = Cliente.builder()
                .equipe(equipe)
                .nome(dto.getNome())
                .cpf(dto.getCpf()) // Salva CPF
                .email(dto.getEmail())
                .telefone(dto.getTelefone())
                .build();

        if (dto.getEnderecos() != null) {
            dto.getEnderecos().forEach(endDto -> {
                Endereco endereco = Endereco.builder()
                        .cep(endDto.getCep())
                        .rua(endDto.getRua())
                        .bairro(endDto.getBairro())
                        .numero(endDto.getNumero())
                        .complemento(endDto.getComplemento())
                        .cidade(endDto.getCidade())
                        .uf(endDto.getUf())
                        .build();
                cliente.addEndereco(endereco);
            });
        }

        Cliente salvo = clienteRepository.save(cliente);
        return ClienteResponseDTO.fromEntity(salvo);
    }

    @Transactional
    public ClienteResponseDTO atualizarCliente(UUID id, ClienteRequestDTO dto, UUID equipeId) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente não encontrado"));

        if (!cliente.getEquipe().getId().equals(equipeId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso negado.");
        }

        cliente.setNome(dto.getNome());
        cliente.setCpf(dto.getCpf()); // Atualiza CPF
        cliente.setEmail(dto.getEmail());
        cliente.setTelefone(dto.getTelefone());

        cliente.getEnderecos().clear();

        if (dto.getEnderecos() != null) {
            dto.getEnderecos().forEach(endDto -> {
                Endereco endereco = Endereco.builder()
                        .cep(endDto.getCep())
                        .rua(endDto.getRua())
                        .bairro(endDto.getBairro())
                        .numero(endDto.getNumero())
                        .complemento(endDto.getComplemento())
                        .cidade(endDto.getCidade())
                        .uf(endDto.getUf())
                        .build();
                cliente.addEndereco(endereco);
            });
        }

        Cliente salvo = clienteRepository.save(cliente);
        return ClienteResponseDTO.fromEntity(salvo);
    }

    @Transactional
    public void removerCliente(UUID id, UUID equipeId) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente não encontrado"));

        if (!cliente.getEquipe().getId().equals(equipeId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso negado.");
        }

        clienteRepository.delete(cliente);
    }
}