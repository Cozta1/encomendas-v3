package com.benfica.encomendas_api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "checklist_logs", indexes = {
        @Index(name = "idx_checklist_log_data", columnList = "data_referencia"),
        @Index(name = "idx_checklist_log_item", columnList = "item_id")
})
public class ChecklistLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OnDelete(action = OnDeleteAction.CASCADE)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false, foreignKey = @ForeignKey(name = "fk_log_item"))
    private ChecklistItem item;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    // Data para qual esse checklist vale (ex: checklist do dia 25/01)
    @Column(name = "data_referencia", nullable = false)
    private LocalDate dataReferencia;

    // Carimbo exato de quando o clique aconteceu
    @CreationTimestamp
    @Column(name = "data_hora_acao", nullable = false, updatable = false)
    private LocalDateTime dataHoraAcao;

    // true = marcou, false = desmarcou
    @Column(nullable = false)
    private Boolean valor;
}