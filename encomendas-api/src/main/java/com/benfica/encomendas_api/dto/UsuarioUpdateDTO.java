package com.benfica.encomendas_api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UsuarioUpdateDTO {

    @NotBlank(message = "O nome é obrigatório")
    @Size(max = 150, message = "O nome não pode exceder 150 caracteres")
    private String nomeCompleto;

    @Size(max = 20, message = "Telefone inválido")
    private String telefone;

    @Size(max = 100, message = "O cargo não pode exceder 100 caracteres")
    private String cargo;

    // Password is optional — only changed if provided
    @Size(min = 8, max = 128, message = "A senha deve ter entre 8 e 128 caracteres")
    private String password;
}
