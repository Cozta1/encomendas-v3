package com.benfica.encomendas_api.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CriarConversaRequest {

    @NotBlank(message = "O ID da equipe é obrigatório")
    private String equipeId;

    private Long destinatarioId; // null = grupo
}
