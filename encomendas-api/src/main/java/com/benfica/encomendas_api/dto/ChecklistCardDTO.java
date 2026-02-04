package com.benfica.encomendas_api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ChecklistCardDTO {
    private UUID id;
    private String titulo;
    private String descricao; // <--- NOVO
    private LocalTime horarioAbertura;
    private LocalTime horarioFechamento;
    private List<ChecklistItemDTO> itens;
    private List<ChecklistAnexoDTO> anexos; // <--- NOVO (Crie o DTO simples para anexo tbm)
    private String status;
}