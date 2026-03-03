package com.benfica.encomendas_api.dto;

import lombok.Data;

@Data
public class SupportTicketRequest {
    private String categoria;
    private String titulo;
    private String descricao;
    private String nomeUsuario;
    private String equipeNome;
}