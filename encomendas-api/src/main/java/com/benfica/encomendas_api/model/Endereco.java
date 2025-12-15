package com.benfica.encomendas_api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "enderecos")
public class Endereco {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @Column(length = 20, nullable = false)
    private String cep;

    @Column(length = 100, nullable = false)
    private String bairro;

    @Column(nullable = false)
    private String rua;

    @Column(length = 20, nullable = false)
    private String numero;

    private String complemento;

    private String cidade;
    private String uf;
}