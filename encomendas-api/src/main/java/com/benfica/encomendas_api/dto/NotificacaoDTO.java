package com.benfica.encomendas_api.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificacaoDTO {
    private UUID id;
    private String titulo;
    private String mensagem;
    private boolean lida;
    private LocalDateTime dataEnvio;
    private Long remetenteId;
    private String remetenteNome;    // null = sistema
    private String destinatarioNome;
}
