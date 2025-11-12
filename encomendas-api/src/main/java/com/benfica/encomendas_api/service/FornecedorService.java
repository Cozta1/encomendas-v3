package com.benfica.encomendas_api.service;

import com.benfica.encomendas_api.dto.FornecedorRequestDTO;
import com.benfica.encomendas_api.dto.FornecedorResponseDTO;
import com.benfica.encomendas_api.model.Equipe;
import com.benfica.encomendas_api.model.Fornecedor;
import com.benfica.encomendas_api.repository.EquipeRepository;
import com.benfica.encomendas_api.repository.FornecedorRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class FornecedorService {

    @Autowired
    private FornecedorRepository fornecedorRepository;

    @Autowired
    private EquipeRepository equipeRepository;

    /**
     * Lista todos os fornecedores pertencentes a uma equipe específica.
     */
    @Transactional(readOnly = true)
    public List<FornecedorResponseDTO> listarFornecedoresPorEquipe(UUID equipeId) {
        List<Fornecedor> fornecedores = fornecedorRepository.findByEquipeId(equipeId);
        return fornecedores.stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    /**
     * Cria um novo fornecedor associado a uma equipe.
     */
    @Transactional
    public FornecedorResponseDTO criarFornecedor(FornecedorRequestDTO dto, UUID equipeId) {
        // 1. Busca a equipe
        Equipe equipe = equipeRepository.findById(equipeId)
                .orElseThrow(() -> new EntityNotFoundException("Equipe não encontrada com ID: " + equipeId));

        // 2. Cria o fornecedor
        Fornecedor fornecedor = Fornecedor.builder()
                .nome(dto.getNome())
                .cnpj(dto.getCnpj())
                .contatoNome(dto.getContatoNome())
                .telefone(dto.getTelefone())
                .email(dto.getEmail())
                .endereco(dto.getEndereco())
                .equipe(equipe) // Associa a equipe
                .build();

        // 3. Salva
        Fornecedor novoFornecedor = fornecedorRepository.save(fornecedor);

        // 4. Retorna o DTO de resposta
        return mapToResponseDTO(novoFornecedor);
    }

    /**
     * Mapeador privado para converter Entidade em DTO de Resposta.
     */
    private FornecedorResponseDTO mapToResponseDTO(Fornecedor fornecedor) {
        return FornecedorResponseDTO.builder()
                .id(fornecedor.getId())
                .nome(fornecedor.getNome())
                .cnpj(fornecedor.getCnpj())
                .contatoNome(fornecedor.getContatoNome())
                .telefone(fornecedor.getTelefone())
                .email(fornecedor.getEmail())
                .endereco(fornecedor.getEndereco())
                .build();
    }
}