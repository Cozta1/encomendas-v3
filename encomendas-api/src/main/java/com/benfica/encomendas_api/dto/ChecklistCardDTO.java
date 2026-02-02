package com.benfica.encomendas_api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChecklistCardDTO {
    private UUID id;
    private String titulo;
    private LocalTime horarioAbertura;
    private LocalTime horarioFechamento;
    private List<ChecklistItemDTO> itens;

    // Estado calculado no backend
    private String status; // ex: "PENDENTE", "ABERTO", "FECHADO", "ATRASADO"
}