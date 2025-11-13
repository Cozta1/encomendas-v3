package com.benfica.encomendas_api.dto;

import com.benfica.encomendas_api.model.EncomendaItem;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class EncomendaItemResponseDTO {
    private UUID id;
    private ProdutoResponseDTO produto;
    private FornecedorResponseDTO fornecedor; // --- NOVO CAMPO ---
    private int quantidade;
    private BigDecimal precoCotado; // --- RENOMEADO ---
    private BigDecimal subtotal;

    public static EncomendaItemResponseDTO fromEntity(EncomendaItem item) {
        return EncomendaItemResponseDTO.builder()
                .id(item.getId())
                .produto(ProdutoResponseDTO.builder()
                        .id(item.getProduto().getId())
                        .nome(item.getProduto().getNome())
                        .codigo(item.getProduto().getCodigo())
                        .precoBase(item.getProduto().getPrecoBase()) // --- ATUALIZADO ---
                        .build())
                .fornecedor(FornecedorResponseDTO.builder() // --- NOVO BLOCO ---
                        .id(item.getFornecedor().getId())
                        .nome(item.getFornecedor().getNome())
                        .build())
                .quantidade(item.getQuantidade())
                .precoCotado(item.getPrecoCotado()) // --- ATUALIZADO ---
                .subtotal(item.getSubtotal())
                .build();
    }
}