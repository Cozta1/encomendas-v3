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
@Table(name = "conversas", indexes = {
    @Index(name = "idx_conversas_equipe", columnList = "equipe_id"),
    @Index(name = "idx_conversas_tipo", columnList = "tipo")
})
public class Conversa {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoConversa tipo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipe_id", nullable = false)
    private Equipe equipe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "participante_a_id", nullable = true)
    private Usuario participanteA;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "participante_b_id", nullable = true)
    private Usuario participanteB;

    @Column(name = "nome_grupo", nullable = true)
    private String nomeGrupo;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;
}
