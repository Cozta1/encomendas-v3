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
    private ClienteResponseDTO cliente; // DTO de Cliente aninhado
    private List<EncomendaItemResponseDTO> itens; // Lista de DTOs de Itens
    private String status;
    private String observacoes;
    private BigDecimal valorTotal;
    private LocalDateTime dataCriacao;

    public static EncomendaResponseDTO fromEntity(Encomenda encomenda) {
        return EncomendaResponseDTO.builder()
                .id(encomenda.getId())
                .cliente(ClienteResponseDTO.fromEntity(encomenda.getCliente())) // Usa o helper do ClienteResponseDTO
                .itens(encomenda.getItens().stream()
                        .map(EncomendaItemResponseDTO::fromEntity) // Usa o helper do ItemResponseDTO
                        .collect(Collectors.toList()))
                .status(encomenda.getStatus())
                .observacoes(encomenda.getObservacoes())
                .valorTotal(encomenda.getValorTotal())
                .dataCriacao(encomenda.getDataCriacao())
                .build();
    }
}