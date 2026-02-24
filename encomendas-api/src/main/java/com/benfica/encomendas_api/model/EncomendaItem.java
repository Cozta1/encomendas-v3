package com.benfica.encomendas_api.model;

import jakarta.persistence.*;
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
@Entity
@Table(name = "encomenda_itens", indexes = {
    @Index(name = "idx_encomenda_itens_encomenda_id", columnList = "encomenda_id"),
    @Index(name = "idx_encomenda_itens_produto_id", columnList = "produto_id"),
    @Index(name = "idx_encomenda_itens_fornecedor_id", columnList = "fornecedor_id")
})
public class EncomendaItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "encomenda_id", nullable = false)
    private Encomenda encomenda;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "produto_id", nullable = false)
    private Produto produto;

    // --- NOVO CAMPO ---
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fornecedor_id") // Pode ser nulo se não houver cotação
    private Fornecedor fornecedor;

    @Column(nullable = false)
    private int quantidade;

    // --- RENOMEADO DE 'precoUnitario' ---
    @Column(name = "preco_cotado", nullable = false, precision = 10, scale = 2)
    private BigDecimal precoCotado;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;
}