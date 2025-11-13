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
    private FornecedorResponseDTO fornecedor;
    private int quantidade;
    private BigDecimal precoCotado;
    private BigDecimal subtotal;

    // --- MÉTODO ATUALIZADO (Null-Safe) ---
    public static EncomendaItemResponseDTO fromEntity(EncomendaItem item) {
        if (item == null) {
            return null;
        }

        return EncomendaItemResponseDTO.builder()
                .id(item.getId())
                // Estes métodos agora são null-safe
                .produto(ProdutoResponseDTO.fromEntity(item.getProduto()))
                .fornecedor(FornecedorResponseDTO.fromEntity(item.getFornecedor()))
                .quantidade(item.getQuantidade())
                .precoCotado(item.getPrecoCotado())
                .subtotal(item.getSubtotal())
                .build();
    }
}