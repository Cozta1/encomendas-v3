package com.benfica.encomendas_api.dto;

import com.benfica.encomendas_api.model.Encomenda;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Data
@Builder
public class EncomendaResponseDTO {
    private UUID id;
    private ClienteResponseDTO cliente;
    private List<EncomendaItemResponseDTO> itens;
    private String status;
    private String observacoes;

    // --- ENDEREÇO ---
    private String enderecoCep;
    private String enderecoBairro;
    private String enderecoRua;
    private String enderecoNumero;
    private String enderecoComplemento;
    // ----------------

    private BigDecimal valorAdiantamento;
    private BigDecimal valorTotal;
    private LocalDateTime dataCriacao;

    // --- NOVO CAMPO PARA O FRONTEND CALCULAR ATRASO ---
    private LocalDateTime dataEstimadaEntrega;

    public static EncomendaResponseDTO fromEntity(Encomenda encomenda) {
        if (encomenda == null) {
            return null;
        }

        return EncomendaResponseDTO.builder()
                .id(encomenda.getId())
                .cliente(ClienteResponseDTO.fromEntity(encomenda.getCliente()))
                .itens(encomenda.getItens().stream()
                        .map(EncomendaItemResponseDTO::fromEntity)
                        .collect(Collectors.toList()))
                .status(encomenda.getStatus())
                .observacoes(encomenda.getObservacoes())
                // Mapeamento dos novos campos
                .enderecoCep(encomenda.getEnderecoCep())
                .enderecoBairro(encomenda.getEnderecoBairro())
                .enderecoRua(encomenda.getEnderecoRua())
                .enderecoNumero(encomenda.getEnderecoNumero())
                .enderecoComplemento(encomenda.getEnderecoComplemento())
                .valorAdiantamento(encomenda.getValorAdiantamento())
                .valorTotal(encomenda.getValorTotal())
                .dataCriacao(encomenda.getDataCriacao())
                // Mapeia a data estimada
                .dataEstimadaEntrega(encomenda.getDataEstimadaEntrega())
                .build();
    }
}