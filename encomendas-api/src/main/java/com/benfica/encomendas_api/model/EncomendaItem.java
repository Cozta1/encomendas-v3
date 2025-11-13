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
@Table(name = "encomenda_itens")
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

    // --- RENOMEADO ---
    @Column(name = "preco_cotado", nullable = false, precision = 10, scale = 2)
    private BigDecimal precoCotado; // Preço final negociado no momento da encomenda

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal; // (quantidade * preco_cotado)
}