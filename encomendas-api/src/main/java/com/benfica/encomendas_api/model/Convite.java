package com.benfica.encomendas_api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "convites", indexes = {
    @Index(name = "idx_convites_equipe_id", columnList = "equipe_id"),
    @Index(name = "idx_convites_email_destino", columnList = "emailDestino"),
    @Index(name = "idx_convites_status", columnList = "status")
})
public class Convite {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String emailDestino;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipe_id", nullable = false)
    private Equipe equipe;

    @Column(nullable = false)
    private String status; // PENDENTE, ACEITO, REJEITADO

    @CreationTimestamp
    private LocalDateTime dataCriacao;
}