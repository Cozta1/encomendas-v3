package com.benfica.encomendas_api.service;

import com.benfica.encomendas_api.dto.FornecedorRequestDTO;
import com.benfica.encomendas_api.dto.FornecedorResponseDTO;
import com.benfica.encomendas_api.model.Endereco;
import com.benfica.encomendas_api.model.Equipe;
import com.benfica.encomendas_api.model.Fornecedor;
import com.benfica.encomendas_api.repository.EquipeRepository;
import com.benfica.encomendas_api.repository.FornecedorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class FornecedorService {

    @Autowired
    private FornecedorRepository fornecedorRepository;

    @Autowired
    private EquipeRepository equipeRepository;

    @Transactional(readOnly = true)
    public List<FornecedorResponseDTO> listarFornecedoresPorEquipe(UUID equipeId) {
        return fornecedorRepository.findByEquipeId(equipeId).stream()
                .map(FornecedorResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    // Método opcional de busca por nome (útil para autocomplete)
    @Transactional(readOnly = true)
    public List<FornecedorResponseDTO> searchFornecedoresPorNome(String nome, UUID equipeId) {
        // Precisa ter o método findByEquipeIdAndNomeContainingIgnoreCase no Repository
        return fornecedorRepository.findByEquipeIdAndNomeContainingIgnoreCase(equipeId, nome).stream()
                .map(FornecedorResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public FornecedorResponseDTO criarFornecedor(FornecedorRequestDTO dto, UUID equipeId) {
        Equipe equipe = equipeRepository.findById(equipeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Equipe não encontrada"));

        // Validação simples de unicidade de email (opcional, pode ser por CNPJ também)
        if (fornecedorRepository.findByEquipeId(equipeId).stream()
                .anyMatch(f -> f.getEmail().equalsIgnoreCase(dto.getEmail()))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Já existe um fornecedor com este email.");
        }

        Fornecedor fornecedor = Fornecedor.builder()
                .equipe(equipe)
                .nome(dto.getNome())
                .cnpj(dto.getCnpj())
                .email(dto.getEmail())
                .telefone(dto.getTelefone())
                .build();

        // Processar endereços
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
                // Helper method na entidade Fornecedor que faz: enderecos.add(e); e.setFornecedor(this);
                fornecedor.addEndereco(endereco);
            });
        }

        Fornecedor salvo = fornecedorRepository.save(fornecedor);
        return FornecedorResponseDTO.fromEntity(salvo);
    }

    @Transactional
    public FornecedorResponseDTO atualizarFornecedor(UUID id, FornecedorRequestDTO dto, UUID equipeId) {
        Fornecedor fornecedor = fornecedorRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Fornecedor não encontrado"));

        if (!fornecedor.getEquipe().getId().equals(equipeId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso negado.");
        }

        // Atualiza dados básicos
        fornecedor.setNome(dto.getNome());
        fornecedor.setCnpj(dto.getCnpj());
        fornecedor.setEmail(dto.getEmail());
        fornecedor.setTelefone(dto.getTelefone());

        // --- ATUALIZAÇÃO DE ENDEREÇOS ---
        // O orphanRemoval=true na entidade cuidará de deletar os endereços removidos
        fornecedor.getEnderecos().clear();

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
                fornecedor.addEndereco(endereco);
            });
        }

        Fornecedor salvo = fornecedorRepository.save(fornecedor);
        return FornecedorResponseDTO.fromEntity(salvo);
    }

    @Transactional
    public void removerFornecedor(UUID id, UUID equipeId) {
        Fornecedor fornecedor = fornecedorRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Fornecedor não encontrado"));

        if (!fornecedor.getEquipe().getId().equals(equipeId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso negado.");
        }

        fornecedorRepository.delete(fornecedor);
    }
}