package com.benfica.encomendas_api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "encomendas")
public class Encomenda {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipe_id", nullable = false)
    private Equipe equipe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    // Relação OneToMany: Uma encomenda tem muitos itens.
    // "cascade = CascadeType.ALL" significa: Salvar/Atualizar/Remover os itens JUNTAMENTE com a encomenda.
    // "orphanRemoval = true" garante que se um item for removido da lista, ele é apagado do banco.
    @Builder.Default
    @OneToMany(mappedBy = "encomenda", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<EncomendaItem> itens = new ArrayList<>();

    @Column(nullable = false, length = 50)
    private String status; // Ex: PENDENTE, CONCLUIDO, CANCELADO

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    @Column(name = "valor_total", precision = 10, scale = 2)
    private BigDecimal valorTotal;

    @CreationTimestamp
    @Column(name = "data_criacao", nullable = false, updatable = false)
    private LocalDateTime dataCriacao;

    // Método helper para adicionar itens de forma síncrona
    public void setItens(List<EncomendaItem> itens) {
        this.itens.clear();
        if (itens != null) {
            itens.forEach(item -> {
                this.itens.add(item);
                item.setEncomenda(this); // Sincroniza o lado "ManyToOne"
            });
        }
    }
}