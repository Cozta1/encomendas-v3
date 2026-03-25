package com.benfica.encomendas_api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequestDTO {

    @NotBlank(message = "O nome completo é obrigatório")
    @Size(max = 150, message = "O nome não pode exceder 150 caracteres")
    private String nomeCompleto;

    @NotBlank(message = "O email é obrigatório")
    @Email(message = "Email inválido")
    @Size(max = 254, message = "Email muito longo")
    private String email;

    @NotBlank(message = "A senha é obrigatória")
    @Size(min = 8, max = 128, message = "A senha deve ter entre 8 e 128 caracteres")
    private String password;

    @NotBlank(message = "CPF é obrigatório")
    @Size(max = 20, message = "CPF inválido")
    private String identificacao;

    @NotBlank(message = "O telefone é obrigatório")
    @Size(max = 20, message = "Telefone inválido")
    private String telefone;

    @NotBlank(message = "A chave de registro é obrigatória")
    @Size(max = 100, message = "Chave de registro inválida")
    private String registrationKey;

    @Size(max = 100, message = "O cargo não pode exceder 100 caracteres")
    private String cargo;
}
