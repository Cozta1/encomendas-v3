package com.benfica.encomendas_api.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "mensagens_chat", indexes = {
    @Index(name = "idx_mensagens_conversa", columnList = "conversa_id"),
    @Index(name = "idx_mensagens_enviado_em", columnList = "enviado_em"),
    @Index(name = "idx_mensagens_remetente_id", columnList = "remetente_id")
})
public class MensagemChat {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversa_id", nullable = false)
    private Conversa conversa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "remetente_id", nullable = false)
    private Usuario remetente;

    @Column(columnDefinition = "TEXT", nullable = true)
    private String conteudo;

    @Builder.Default
    @Column(nullable = false)
    private boolean deletada = false;

    @CreationTimestamp
    @Column(name = "enviado_em", nullable = false, updatable = false)
    private LocalDateTime enviadoEm;

    @OneToMany(mappedBy = "mensagem", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<MensagemAnexo> anexos;
}
