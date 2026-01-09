package com.benfica.encomendas_api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class EncomendaRequestDTO {

    // --- MUDANÇA: Recebe dados do Cliente em vez de ID ---
    @Valid
    @NotNull(message = "Os dados do cliente são obrigatórios.")
    private ClienteDataDTO cliente;

    // --- ENDEREÇO ---
    @NotBlank(message = "O CEP é obrigatório.")
    private String enderecoCep;
    @NotBlank(message = "O Bairro é obrigatório.")
    private String enderecoBairro;
    @NotBlank(message = "A Rua é obrigatória.")
    private String enderecoRua;
    @NotBlank(message = "O Número é obrigatório.")
    private String enderecoNumero;
    private String enderecoComplemento;

    // --- OUTROS ---
    private LocalDateTime dataEstimadaEntrega;
    private boolean notaFutura;
    private boolean vendaEstoqueNegativo;
    private BigDecimal valorAdiantamento;
    private String observacoes;

    @Valid
    @NotEmpty(message = "A encomenda deve ter pelo menos um item.")
    private List<ItemDataDTO> itens;

    // --- DTOs INTERNOS PARA ESTRUTURAR O JSON ---

    @Data
    public static class ClienteDataDTO {
        @NotBlank(message = "Nome do cliente é obrigatório")
        private String nome;

        // --- NOVO CAMPO ADICIONADO ---
        private String codigoInterno;

        private String cpf;
        private String email;
        private String telefone;
    }

    @Data
    public static class ItemDataDTO {
        @Valid
        @NotNull
        private ProdutoDataDTO produto;

        @Valid
        @NotNull
        private FornecedorDataDTO fornecedor;

        private Integer quantidade;
        private BigDecimal precoCotado;
        private String descricaoOpcional;
    }

    @Data
    public static class ProdutoDataDTO {
        @NotBlank(message = "Nome do produto é obrigatório")
        private String nome;
        private String codigo;
    }

    @Data
    public static class FornecedorDataDTO {
        @NotBlank(message = "Nome do fornecedor é obrigatório")
        private String nome;
    }
}