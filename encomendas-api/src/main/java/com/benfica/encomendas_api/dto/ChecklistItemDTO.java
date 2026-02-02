package com.benfica.encomendas_api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChecklistItemDTO {
    private UUID id;
    private String descricao;
    private Integer ordem;

    // Campos de estado (preenchidos apenas na leitura do dia)
    private Boolean marcado;
    private String marcadoPor; // Nome de quem marcou (opcional, se quiser mostrar)
}