package com.benfica.encomendas_api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CriarConversaRequest {
    private String equipeId;
    private Long destinatarioId; // null = grupo
}
