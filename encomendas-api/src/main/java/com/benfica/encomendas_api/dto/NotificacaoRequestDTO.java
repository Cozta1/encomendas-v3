package com.benfica.encomendas_api.dto;

import lombok.*;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificacaoRequestDTO {
    private UUID equipeId;
    private Long destinatarioId; // null = enviar para toda a equipe
    private Long remetenteId;
    private String titulo;
    private String mensagem;
}
