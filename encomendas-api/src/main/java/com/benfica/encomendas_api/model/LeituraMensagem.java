package com.benfica.encomendas_api.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "leituras_mensagem", uniqueConstraints = {
    @UniqueConstraint(name = "uk_leitura_conversa_usuario", columnNames = {"conversa_id", "usuario_id"})
})
public class LeituraMensagem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversa_id", nullable = false)
    private Conversa conversa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "ultimo_visto_em", nullable = false)
    private LocalDateTime ultimoVistoEm;
}
