package com.benfica.encomendas_api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EnviarMensagemRequest {
    private UUID conversaId;
    private String conteudo;
    private List<MensagemAnexoDTO> urlsAnexos;
}
