package com.benfica.encomendas_api.dto;

import com.benfica.encomendas_api.model.EncomendaHistorico;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class EncomendaHistoricoDTO {
    private String status;
    private LocalDateTime dataAlteracao;
    private String nomeUsuario;

    public static EncomendaHistoricoDTO fromEntity(EncomendaHistorico entity) {
        return EncomendaHistoricoDTO.builder()
                .status(entity.getStatus())
                .dataAlteracao(entity.getDataAlteracao())
                .nomeUsuario(entity.getNomeUsuario())
                .build();
    }
}