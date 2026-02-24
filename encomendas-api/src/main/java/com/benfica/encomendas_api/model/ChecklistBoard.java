package com.benfica.encomendas_api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "checklist_boards", indexes = {
    @Index(name = "idx_checklist_boards_equipe_id", columnList = "equipe_id"),
    @Index(name = "idx_checklist_boards_usuario_id", columnList = "usuario_especifico_id"),
    @Index(name = "idx_checklist_boards_ordem", columnList = "ordem")
})
public class ChecklistBoard {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String nome;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipe_id", nullable = false)
    private Equipe equipe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_especifico_id", nullable = true)
    private Usuario usuarioEspecifico;

    // --- CAMPO DE ORDENAÇÃO (ADICIONADO) ---
    @Column(name = "ordem")
    private Integer ordem;
    // ---------------------------------------

    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 30)
    private List<ChecklistCard> cards = new ArrayList<>();

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime dataCriacao;

    @Builder.Default
    private Boolean ativo = true;
}