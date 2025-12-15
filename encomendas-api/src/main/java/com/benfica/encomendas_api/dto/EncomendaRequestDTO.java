package com.benfica.encomendas_api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class EncomendaRequestDTO {
    @NotNull(message = "O cliente é obrigatório.")
    private UUID clienteId;

    // --- ENDEREÇO ---
    @NotBlank(message = "O CEP é obrigatório.")
    private String enderecoCep;

    @NotBlank(message = "O Bairro é obrigatório.")
    private String enderecoBairro;

    @NotBlank(message = "A Rua é obrigatória.")
    private String enderecoRua;

    @NotBlank(message = "O Número é obrigatório.")
    private String enderecoNumero;

    private String enderecoComplemento; // Opcional
    // ----------------

    private BigDecimal valorAdiantamento;

    private String observacoes;

    @Valid
    @NotEmpty(message = "A encomenda deve ter pelo menos um item.")
    private List<EncomendaItemRequestDTO> itens;
}