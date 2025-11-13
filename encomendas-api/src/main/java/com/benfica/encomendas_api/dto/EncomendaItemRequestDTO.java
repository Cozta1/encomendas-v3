package com.benfica.encomendas_api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal; // Importar
import java.util.UUID;

@Data
public class EncomendaItemRequestDTO {
    @NotNull
    private UUID produtoId;

    // --- NOVO CAMPO ---
    @NotNull
    private UUID fornecedorId;

    // --- NOVO CAMPO ---
    @NotNull
    @Min(0)
    private BigDecimal precoCotado;

    @Min(1)
    private int quantidade;
}