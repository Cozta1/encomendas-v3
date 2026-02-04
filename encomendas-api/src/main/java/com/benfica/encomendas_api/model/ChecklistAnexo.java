package com.benfica.encomendas_api.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "checklist_anexos")
public class ChecklistAnexo {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String nomeArquivo;
    private String tipoArquivo; // ex: 'PDF', 'IMG', 'LINK'
    private String url; // URL ou caminho do arquivo

    @ManyToOne
    @JoinColumn(name = "card_id")
    @JsonIgnore
    private ChecklistCard card;
}