package com.benfica.encomendas_api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MensagemChatDTO {
    private UUID id;
    private UUID conversaId;
    private Long remetenteId;
    private String remetenteNome;
    private String conteudo;
    private LocalDateTime enviadoEm;
    private boolean deletada;
    private List<MensagemAnexoDTO> anexos;
}
