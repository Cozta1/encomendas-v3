package com.benfica.encomendas_api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversaDTO {
    private UUID id;
    private String tipo;
    private String nomeExibicao;
    private Long outroUsuarioId;
    private String ultimaMensagem;
    private LocalDateTime ultimaMensagemEm;
    private long naoLidas;
}
