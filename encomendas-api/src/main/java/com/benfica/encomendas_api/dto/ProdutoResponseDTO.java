package com.benfica.encomendas_api.dto;

import com.benfica.encomendas_api.model.Produto; // Importar
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProdutoResponseDTO {
    private UUID id;
    private String nome;
    private String codigo;
    private String descricao;
    private BigDecimal precoBase;

    // --- NOVO MÉTODO ESTÁTICO ---
    public static ProdutoResponseDTO fromEntity(Produto produto) {
        // --- ADICIONADA VERIFICAÇÃO DE NULO ---
        if (produto == null) {
            return null;
        }
        return ProdutoResponseDTO.builder()
                .id(produto.getId())
                .nome(produto.getNome())
                .codigo(produto.getCodigo())
                .descricao(produto.getDescricao())
                .precoBase(produto.getPrecoBase())
                .build();
    }
}