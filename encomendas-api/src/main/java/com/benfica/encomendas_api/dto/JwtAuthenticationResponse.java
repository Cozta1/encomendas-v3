package com.benfica.encomendas_api.dto;

import lombok.Data;

@Data
public class JwtAuthenticationResponse {
    private String accessToken;
    private String tokenType = "Bearer";
    private String role;
    private String nome;
    private Long id;

    // Construtor com 3 argumentos (Causa do seu erro anterior se faltar)
    public JwtAuthenticationResponse(String accessToken, String role, String nome, Long id) {
        this.accessToken = accessToken;
        this.role = role;
        this.nome = nome;
        this.id = id;
    }
}