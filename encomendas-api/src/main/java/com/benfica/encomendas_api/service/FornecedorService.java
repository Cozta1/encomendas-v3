package com.benfica.encomendas_api.service;

import com.benfica.encomendas_api.dto.FornecedorRequestDTO;
import com.benfica.encomendas_api.dto.FornecedorResponseDTO;
import com.benfica.encomendas_api.model.Equipe;
import com.benfica.encomendas_api.model.Fornecedor;
import com.benfica.encomendas_api.repository.EquipeRepository;
import com.benfica.encomendas_api.repository.FornecedorRepository;
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

    @Transactional(readOnly = true)
    public List<FornecedorResponseDTO> listarFornecedoresPorEquipe(UUID equipeId) {
        return fornecedorRepository.findByEquipeId(equipeId).stream()
                .map(this::paraResponseDTO)
                .collect(Collectors.toList());
    }

    // --- NOVO MÉTODO (SEARCH) ---
    @Transactional(readOnly = true)
    public List<FornecedorResponseDTO> searchFornecedoresPorNome(String nome, UUID equipeId) {
        return fornecedorRepository.findByEquipeIdAndNomeContainingIgnoreCase(equipeId, nome)
                .stream()
                .map(this::paraResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public FornecedorResponseDTO criarFornecedor(FornecedorRequestDTO dto, UUID equipeId) {
        Equipe equipe = equipeRepository.findById(equipeId)
                .orElseThrow(() -> new RuntimeException("Equipe não encontrada"));

        Fornecedor fornecedor = Fornecedor.builder()
                .nome(dto.getNome())
                .cnpj(dto.getCnpj())
                .contatoNome(dto.getContatoNome())
                .telefone(dto.getTelefone())
                .email(dto.getEmail())
                .endereco(dto.getEndereco())
                .equipe(equipe)
                .build();

        Fornecedor salvo = fornecedorRepository.save(fornecedor);
        return paraResponseDTO(salvo);
    }

    @Transactional
    public FornecedorResponseDTO atualizarFornecedor(UUID id, FornecedorRequestDTO dto, UUID equipeId) {
        Fornecedor fornecedor = fornecedorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Fornecedor não encontrado com ID: " + id));

        if (!fornecedor.getEquipe().getId().equals(equipeId)) {
            throw new RuntimeException("Acesso negado: Este fornecedor não pertence à sua equipe.");
        }

        fornecedor.setNome(dto.getNome());
        fornecedor.setCnpj(dto.getCnpj());
        fornecedor.setContatoNome(dto.getContatoNome());
        fornecedor.setTelefone(dto.getTelefone());
        fornecedor.setEmail(dto.getEmail());
        fornecedor.setEndereco(dto.getEndereco());

        Fornecedor atualizado = fornecedorRepository.save(fornecedor);
        return paraResponseDTO(atualizado);
    }

    @Transactional
    public void removerFornecedor(UUID id, UUID equipeId) {
        Fornecedor fornecedor = fornecedorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Fornecedor não encontrado com ID: " + id));

        if (!fornecedor.getEquipe().getId().equals(equipeId)) {
            throw new RuntimeException("Acesso negado: Este fornecedor não pertence à sua equipe.");
        }

        fornecedorRepository.delete(fornecedor);
    }

    private FornecedorResponseDTO paraResponseDTO(Fornecedor fornecedor) {
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