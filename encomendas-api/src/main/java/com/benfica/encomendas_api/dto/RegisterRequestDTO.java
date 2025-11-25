package com.benfica.encomendas_api.dto;

import lombok.Data;

@Data
public class RegisterRequestDTO {
    private String nomeCompleto;
    private String email;
    private String password;
    private String identificacao;
    private String telefone;
    private String registrationKey;
}