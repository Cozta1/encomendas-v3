package com.benfica.encomendas_api.service;

import com.benfica.encomendas_api.dto.FornecedorRequestDTO;
import com.benfica.encomendas_api.dto.FornecedorResponseDTO;
import com.benfica.encomendas_api.model.Equipe;
import com.benfica.encomendas_api.model.Fornecedor;
import com.benfica.encomendas_api.repository.EquipeRepository;
import com.benfica.encomendas_api.repository.FornecedorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus; // Importar
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException; // Importar

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
                .map(FornecedorResponseDTO::fromEntity) // <-- USA O MÉTODO DO DTO
                .collect(Collectors.toList());
    }

    @Transactional
    public FornecedorResponseDTO criarFornecedor(FornecedorRequestDTO dto, UUID equipeId) {
        Equipe equipe = equipeRepository.findById(equipeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Equipe não encontrada"));

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
        return FornecedorResponseDTO.fromEntity(salvo); // <-- USA O MÉTODO DO DTO
    }

    @Transactional
    public FornecedorResponseDTO atualizarFornecedor(UUID id, FornecedorRequestDTO dto, UUID equipeId) {
        Fornecedor fornecedor = fornecedorRepository.findByIdAndEquipeId(id, equipeId) // Usa o método correto
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Fornecedor não encontrado ou não pertence à equipe"));

        fornecedor.setNome(dto.getNome());
        fornecedor.setCnpj(dto.getCnpj());
        fornecedor.setContatoNome(dto.getContatoNome());
        fornecedor.setTelefone(dto.getTelefone());
        fornecedor.setEmail(dto.getEmail());
        fornecedor.setEndereco(dto.getEndereco());

        Fornecedor atualizado = fornecedorRepository.save(fornecedor);
        return FornecedorResponseDTO.fromEntity(atualizado); // <-- USA O MÉTODO DO DTO
    }

    @Transactional
    public void removerFornecedor(UUID id, UUID equipeId) {
        Fornecedor fornecedor = fornecedorRepository.findByIdAndEquipeId(id, equipeId) // Usa o método correto
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Fornecedor não encontrado ou não pertence à equipe"));

        fornecedorRepository.delete(fornecedor);
    }

    // Método 'paraResponseDTO' removido daqui
}