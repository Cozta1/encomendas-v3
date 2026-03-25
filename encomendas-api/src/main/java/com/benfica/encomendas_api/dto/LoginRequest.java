package com.benfica.encomendas_api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "O email é obrigatório")
    @Size(max = 254, message = "Email muito longo")
    private String email;

    @NotBlank(message = "A senha é obrigatória")
    @Size(max = 128, message = "Senha muito longa")
    private String password;
}
