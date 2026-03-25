package com.benfica.encomendas_api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResetPasswordDTO {

    @NotBlank(message = "O email é obrigatório")
    @Email(message = "Email inválido")
    @Size(max = 254, message = "Email muito longo")
    private String email;

    // UUID reset tokens are 36 chars; cap at 128 to prevent token-flooding DoS
    @NotBlank(message = "O código de reset é obrigatório")
    @Size(max = 128, message = "Token inválido")
    private String token;

    @NotBlank(message = "A nova senha é obrigatória")
    @Size(min = 8, max = 128, message = "A senha deve ter entre 8 e 128 caracteres")
    private String newPassword;
}
