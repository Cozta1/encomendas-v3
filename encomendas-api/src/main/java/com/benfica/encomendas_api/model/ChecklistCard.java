package com.benfica.encomendas_api.model;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    private ChecklistBoard board;

    // Horário que o checklist fica disponível para marcação
    @Column(name = "horario_abertura", nullable = false)
    private LocalTime horarioAbertura;

    // Horário limite. Se passar daqui e não estiver completo, fica vermelho no histórico.
    @Column(name = "horario_fechamento", nullable = false)
    private LocalTime horarioFechamento;

    @OneToMany(mappedBy = "card", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChecklistItem> itens = new ArrayList<>();
}