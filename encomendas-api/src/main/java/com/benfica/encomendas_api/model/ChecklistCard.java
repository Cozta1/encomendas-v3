package com.benfica.encomendas_api.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "checklist_cards")
public class ChecklistCard {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String titulo;

    // --- CAMPO NOVO: Descrição detalhada (estilo Trello) ---
    @Column(columnDefinition = "TEXT")
    private String descricao;
    // -------------------------------------------------------

    @Column(nullable = false)
    private LocalTime horarioAbertura;

    @Column(nullable = false)
    private LocalTime horarioFechamento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    @JsonIgnore
    private ChecklistBoard board;

    @OneToMany(mappedBy = "card", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChecklistItem> itens = new ArrayList<>();

    // --- CAMPO NOVO: Lista de Anexos ---
    @OneToMany(mappedBy = "card", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ChecklistAnexo> anexos = new ArrayList<>();
    // -----------------------------------
}