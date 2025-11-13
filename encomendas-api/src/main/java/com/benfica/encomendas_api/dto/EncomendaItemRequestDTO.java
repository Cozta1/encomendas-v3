package com.benfica.encomendas_api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.UUID;

@Data
public class EncomendaItemRequestDTO {
    @NotNull
    private UUID produtoId;

    @Min(1)
    private int quantidade;
}