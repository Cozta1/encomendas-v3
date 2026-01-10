package com.benfica.encomendas_api.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "encomenda_historico")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EncomendaHistorico {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "encomenda_id")
    private Encomenda encomenda;

    private String status; // O status que foi definido
    private LocalDateTime dataAlteracao;
    private String nomeUsuario; // Quem alterou
}