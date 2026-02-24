package com.benfica.encomendas_api.model; //

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "clientes", indexes = {
    @Index(name = "idx_clientes_equipe_id", columnList = "equipe_id"),
    @Index(name = "idx_clientes_email", columnList = "email"),
    @Index(name = "idx_clientes_cpf", columnList = "cpf"),
    @Index(name = "idx_clientes_codigo_interno", columnList = "codigo_interno")
})
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipe_id", nullable = false)
    private Equipe equipe;

    @Column(nullable = false)
    private String nome;

    // --- NOVO CAMPO: CODIGO INTERNO ---
    @Column(name = "codigo_interno", length = 50) // Ajuste o length conforme necessário
    private String codigoInterno;
    // ----------------------------------

    @Column(length = 14) // Ex: 000.000.000-00
    private String cpf;

    @Column(nullable = false, length = 100)
    private String email;

    @Column(length = 20)
    private String telefone;

    @Builder.Default
    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Endereco> enderecos = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(name = "atualizado_em")
    private LocalDateTime atualizadoEm;

    public void addEndereco(Endereco endereco) {
        enderecos.add(endereco);
        endereco.setCliente(this);
    }
}