package com.benfica.encomendas_api.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "notificacoes", indexes = {
    @Index(name = "idx_notificacoes_destinatario", columnList = "destinatario_id"),
    @Index(name = "idx_notificacoes_equipe", columnList = "equipe_id"),
    @Index(name = "idx_notificacoes_chave_dedup", columnList = "chave_dedup")
})
public class Notificacao {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipe_id", nullable = false)
    private Equipe equipe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destinatario_id", nullable = false)
    private Usuario destinatario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "remetente_id", nullable = true)
    private Usuario remetente; // null = sistema

    @Column(nullable = false)
    private String titulo;

    @Column(columnDefinition = "TEXT")
    private String mensagem;

    @Builder.Default
    @Column(nullable = false)
    private boolean lida = false;

    @CreationTimestamp
    @Column(name = "data_envio", nullable = false, updatable = false)
    private LocalDateTime dataEnvio;

    @Column(name = "chave_dedup", unique = true, nullable = true)
    private String chaveDedup;
}
