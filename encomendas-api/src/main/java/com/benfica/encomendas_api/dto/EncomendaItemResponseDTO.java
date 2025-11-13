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
    private ProdutoResponseDTO produto; // DTO de Produto aninhado
    private int quantidade;
    private BigDecimal precoUnitario;
    private BigDecimal subtotal;

    public static EncomendaItemResponseDTO fromEntity(EncomendaItem item) {
        return EncomendaItemResponseDTO.builder()
                .id(item.getId())
                .produto(ProdutoResponseDTO.builder() // Constrói o DTO de Produto
                        .id(item.getProduto().getId())
                        .nome(item.getProduto().getNome())
                        .codigo(item.getProduto().getCodigo())
                        .preco(item.getProduto().getPreco())
                        .build())
                .quantidade(item.getQuantidade())
                .precoUnitario(item.getPrecoUnitario())
                .subtotal(item.getSubtotal())
                .build();
    }
}