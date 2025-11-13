package com.benfica.encomendas_api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class EncomendaRequestDTO {
    @NotNull
    private UUID clienteId;

    private String observacoes;

    @Valid // Valida os objetos dentro da lista
    @NotEmpty // A lista não pode estar vazia
    private List<EncomendaItemRequestDTO> itens;
}