package com.benfica.encomendas_api.service;

import com.benfica.encomendas_api.dto.ProdutoRequestDTO;
import com.benfica.encomendas_api.dto.ProdutoResponseDTO;
import com.benfica.encomendas_api.model.Equipe;
import com.benfica.encomendas_api.model.Produto;
import com.benfica.encomendas_api.repository.EquipeRepository;
import com.benfica.encomendas_api.repository.ProdutoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
                .map(this::paraResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProdutoResponseDTO criarProduto(ProdutoRequestDTO dto, UUID equipeId) {
        Equipe equipe = equipeRepository.findById(equipeId)
                .orElseThrow(() -> new RuntimeException("Equipe não encontrada"));

        Produto produto = Produto.builder()
                .nome(dto.getNome())
                .codigo(dto.getCodigo())
                .descricao(dto.getDescricao())
                .preco(dto.getPreco())
                .equipe(equipe)
                .build();

        Produto salvo = produtoRepository.save(produto);
        return paraResponseDTO(salvo);
    }

    @Transactional
    public ProdutoResponseDTO atualizarProduto(UUID id, ProdutoRequestDTO dto, UUID equipeId) {
        Produto produto = produtoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produto não encontrado com ID: " + id));

        if (!produto.getEquipe().getId().equals(equipeId)) {
            throw new RuntimeException("Acesso negado: Este produto não pertence à sua equipe.");
        }

        produto.setNome(dto.getNome());
        produto.setCodigo(dto.getCodigo());
        produto.setDescricao(dto.getDescricao());
        produto.setPreco(dto.getPreco());

        Produto atualizado = produtoRepository.save(produto);
        return paraResponseDTO(atualizado);
    }

    @Transactional
    public void removerProduto(UUID id, UUID equipeId) {
        Produto produto = produtoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produto não encontrado com ID: " + id));

        if (!produto.getEquipe().getId().equals(equipeId)) {
            throw new RuntimeException("Acesso negado: Este produto não pertence à sua equipe.");
        }

        produtoRepository.delete(produto);
    }

    // Método helper para converter Entidade para DTO
    private ProdutoResponseDTO paraResponseDTO(Produto produto) {
        return ProdutoResponseDTO.builder()
                .id(produto.getId())
                .nome(produto.getNome())
                .codigo(produto.getCodigo())
                .descricao(produto.getDescricao())
                .preco(produto.getPreco())
                .build();
    }
}