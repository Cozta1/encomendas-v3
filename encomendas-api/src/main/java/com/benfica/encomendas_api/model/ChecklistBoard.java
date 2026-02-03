package com.benfica.encomendas_api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
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
@Table(name = "checklist_boards")
public class ChecklistBoard {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String nome;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipe_id", nullable = false)
    private Equipe equipe;

    // --- NOVO: Se estiver preenchido, é exclusivo deste usuário. Se null, é geral da equipe. ---
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_especifico_id", nullable = true)
    private Usuario usuarioEspecifico;
    // -----------------------------------------------------------------------------------------

    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChecklistCard> cards = new ArrayList<>();

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime dataCriacao;

    @Builder.Default
    private Boolean ativo = true;
}