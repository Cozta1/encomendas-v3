package com.benfica.encomendas_api.service;

import com.benfica.encomendas_api.dto.ProdutoRequestDTO;
import com.benfica.encomendas_api.dto.ProdutoResponseDTO;
import com.benfica.encomendas_api.model.Equipe;
import com.benfica.encomendas_api.model.Produto;
import com.benfica.encomendas_api.repository.EquipeRepository;
import com.benfica.encomendas_api.repository.ProdutoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus; // Importar
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException; // Importar

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ProdutoService {

    @Autowired
    private ProdutoRepository produtoRepository;
    @Autowired
    private EquipeRepository equipeRepository;

    @Transactional(readOnly = true)
    public List<ProdutoResponseDTO> listarProdutosPorEquipe(UUID equipeId) {
        return produtoRepository.findByEquipeId(equipeId).stream()
                .map(ProdutoResponseDTO::fromEntity) // <-- USA O MÉTODO DO DTO
                .collect(Collectors.toList());
    }

    @Transactional
    public ProdutoResponseDTO criarProduto(ProdutoRequestDTO dto, UUID equipeId) {
        Equipe equipe = equipeRepository.findById(equipeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Equipe não encontrada"));

        Produto produto = Produto.builder()
                .nome(dto.getNome())
                .codigo(dto.getCodigo())
                .descricao(dto.getDescricao())
                .precoBase(dto.getPreco())
                .equipe(equipe)
                .build();

        Produto salvo = produtoRepository.save(produto);
        return ProdutoResponseDTO.fromEntity(salvo); // <-- USA O MÉTODO DO DTO
    }

    @Transactional
    public ProdutoResponseDTO atualizarProduto(UUID id, ProdutoRequestDTO dto, UUID equipeId) {
        Produto produto = produtoRepository.findByIdAndEquipeId(id, equipeId) // Usa o método correto
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado ou não pertence à equipe"));

        produto.setNome(dto.getNome());
        produto.setCodigo(dto.getCodigo());
        produto.setDescricao(dto.getDescricao());
        produto.setPrecoBase(dto.getPreco());

        Produto atualizado = produtoRepository.save(produto);
        return ProdutoResponseDTO.fromEntity(atualizado); // <-- USA O MÉTODO DO DTO
    }

    @Transactional
    public void removerProduto(UUID id, UUID equipeId) {
        Produto produto = produtoRepository.findByIdAndEquipeId(id, equipeId) // Usa o método correto
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado ou não pertence à equipe"));

        produtoRepository.delete(produto);
    }

    // Método 'paraResponseDTO' removido daqui
}