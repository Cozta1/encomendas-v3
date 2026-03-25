package com.benfica.encomendas_api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificacaoRequestDTO {

    @NotNull(message = "O ID da equipe é obrigatório")
    private UUID equipeId;

    private Long destinatarioId; // null = enviar para toda a equipe

    // remetenteId is intentionally NOT validated here — it is ignored by the controller.
    // The actual sender ID is always taken from the authenticated principal (IDOR fix).
    private Long remetenteId;

    @NotBlank(message = "O título é obrigatório")
    @Size(max = 150, message = "O título não pode exceder 150 caracteres")
    private String titulo;

    @NotBlank(message = "A mensagem é obrigatória")
    @Size(max = 1000, message = "A mensagem não pode exceder 1000 caracteres")
    private String mensagem;
}
