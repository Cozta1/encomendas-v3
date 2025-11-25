package com.benfica.encomendas_api.dto;

import lombok.Data;

@Data
public class JwtAuthenticationResponse {
    private String accessToken;
    private String tokenType = "Bearer";
    private String role; // Adicionado
    private String nome; // Adicionado

    public JwtAuthenticationResponse(String accessToken, String role, String nome) {
        this.accessToken = accessToken;
        this.role = role;
        this.nome = nome;
    }
}