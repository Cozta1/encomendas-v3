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

    // Campo novo para identificar dono do quadro (null = Todos)
    private Long usuarioEspecificoId;

    private List<ChecklistCardDTO> cards;
}