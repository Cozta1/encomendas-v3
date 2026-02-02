package com.benfica.encomendas_api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChecklistBoardDTO {
    private UUID id;
    private String nome;
    private UUID equipeId;
    private List<ChecklistCardDTO> cards;
}