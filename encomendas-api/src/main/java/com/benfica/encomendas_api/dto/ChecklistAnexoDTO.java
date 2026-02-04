package com.benfica.encomendas_api.dto;

import com.benfica.encomendas_api.model.ChecklistAnexo;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChecklistAnexoDTO {
    private UUID id;
    private String nomeArquivo;
    private String tipoArquivo; // Ex: 'PDF', 'IMAGE', 'DOC'
    private String url;

    // Método helper para converter da Entidade para DTO
    public static ChecklistAnexoDTO fromEntity(ChecklistAnexo anexo) {
        if (anexo == null) return null;
        return ChecklistAnexoDTO.builder()
                .id(anexo.getId())
                .nomeArquivo(anexo.getNomeArquivo())
                .tipoArquivo(anexo.getTipoArquivo())
                .url(anexo.getUrl())
                .build();
    }
}