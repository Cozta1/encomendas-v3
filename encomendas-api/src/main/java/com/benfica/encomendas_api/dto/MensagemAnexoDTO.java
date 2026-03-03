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
public class MensagemAnexoDTO {
    private UUID id;
    private String nomeArquivo;
    private String tipoArquivo;
    private String url;
}
