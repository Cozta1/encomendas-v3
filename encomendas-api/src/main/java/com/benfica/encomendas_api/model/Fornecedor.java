package com.benfica.encomendas_api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "fornecedores", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"equipe_id", "cnpj"})
})
public class Fornecedor {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipe_id", nullable = false)
    private Equipe equipe;

    @Column(nullable = false)
    private String nome;

    // --- CAMPOS ADICIONADOS ---
    @Column(unique = true, length = 18)
    private String cnpj;

    @Column(name = "contato_nome", length = 100)
    private String contatoNome;

    @Column(length = 20)
    private String telefone;

    @Column(length = 100)
    private String email;

    @Column(columnDefinition = "TEXT")
    private String endereco;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(name = "atualizado_em")
    private LocalDateTime atualizadoEm;
    // --- FIM DOS CAMPOS ADICIONADOS ---
}