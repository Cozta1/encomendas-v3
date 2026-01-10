package com.benfica.encomendas_api.dto;

import com.benfica.encomendas_api.model.Encomenda;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
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

    // --- DATAS E HISTÓRICO ---
    private LocalDateTime dataEstimadaEntrega;
    private List<EncomendaHistoricoDTO> historico;

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
                // Endereço
                .enderecoCep(encomenda.getEnderecoCep())
                .enderecoBairro(encomenda.getEnderecoBairro())
                .enderecoRua(encomenda.getEnderecoRua())
                .enderecoNumero(encomenda.getEnderecoNumero())
                .enderecoComplemento(encomenda.getEnderecoComplemento())
                // Valores
                .valorAdiantamento(encomenda.getValorAdiantamento())
                .valorTotal(encomenda.getValorTotal())
                .dataCriacao(encomenda.getDataCriacao())
                // Novos Campos
                .dataEstimadaEntrega(encomenda.getDataEstimadaEntrega())
                .historico(encomenda.getHistorico() != null ?
                        encomenda.getHistorico().stream()
                                .map(EncomendaHistoricoDTO::fromEntity)
                                .collect(Collectors.toList()) : new ArrayList<>())
                .build();
    }
}