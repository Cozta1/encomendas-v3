package com.benfica.encomendas_api.service;

import com.benfica.encomendas_api.dto.ClienteRequestDTO;
import com.benfica.encomendas_api.dto.ClienteResponseDTO;
import com.benfica.encomendas_api.model.Cliente;
import com.benfica.encomendas_api.model.Equipe;
import com.benfica.encomendas_api.repository.ClienteRepository;
import com.benfica.encomendas_api.repository.EquipeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus; // Importar
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException; // Importar

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
                .map(ClienteResponseDTO::fromEntity) // <-- USA O MÉTODO DO DTO
                .collect(Collectors.toList());
    }

    @Transactional
    public ClienteResponseDTO criarCliente(ClienteRequestDTO dto, UUID equipeId) {
        Equipe equipe = equipeRepository.findById(equipeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Equipe não encontrada"));

        Cliente cliente = Cliente.builder()
                .nome(dto.getNome())
                .telefone(dto.getTelefone())
                .email(dto.getEmail())
                .cpfCnpj(dto.getCpfCnpj())
                .endereco(dto.getEndereco())
                .equipe(equipe)
                .build();

        Cliente salvo = clienteRepository.save(cliente);
        return ClienteResponseDTO.fromEntity(salvo); // <-- USA O MÉTODO DO DTO
    }

    @Transactional
    public ClienteResponseDTO atualizarCliente(UUID id, ClienteRequestDTO dto, UUID equipeId) {
        Cliente cliente = clienteRepository.findByIdAndEquipeId(id, equipeId) // Usa o método correto
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente não encontrado ou não pertence à equipe"));

        cliente.setNome(dto.getNome());
        cliente.setTelefone(dto.getTelefone());
        cliente.setEmail(dto.getEmail());
        cliente.setCpfCnpj(dto.getCpfCnpj());
        cliente.setEndereco(dto.getEndereco());

        Cliente atualizado = clienteRepository.save(cliente);
        return ClienteResponseDTO.fromEntity(atualizado); // <-- USA O MÉTODO DO DTO
    }

    @Transactional
    public void removerCliente(UUID id, UUID equipeId) {
        Cliente cliente = clienteRepository.findByIdAndEquipeId(id, equipeId) // Usa o método correto
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente não encontrado ou não pertence à equipe"));

        clienteRepository.delete(cliente);
    }

    // Método 'paraResponseDTO' removido daqui
}