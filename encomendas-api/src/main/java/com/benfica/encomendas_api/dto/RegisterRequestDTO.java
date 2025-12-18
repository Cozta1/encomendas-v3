package com.benfica.encomendas_api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegisterRequestDTO {

    @NotBlank(message = "O nome completo é obrigatório")
    private String nomeCompleto;

    @NotBlank(message = "O email é obrigatório")
    @Email(message = "Email inválido")
    private String email;

    @NotBlank(message = "A senha é obrigatória")
    private String password;

    // Identificação (CPF) é opcional no registro inicial segundo sua lógica atual,
    // mas se preenchido, será formatado no front.
    @NotBlank(message = "CPF é obrigatório")
    private String identificacao;

    // --- AGORA OBRIGATÓRIO ---
    @NotBlank(message = "O telefone é obrigatório")
    private String telefone;

    @NotBlank(message = "A chave de registro é obrigatória")
    private String registrationKey;

    private String cargo;
}