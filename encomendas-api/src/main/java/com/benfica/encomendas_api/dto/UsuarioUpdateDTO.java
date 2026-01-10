package com.benfica.encomendas_api.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UsuarioUpdateDTO {
    @NotBlank(message = "O nome é obrigatório")
    private String nomeCompleto;

    private String telefone;
    private String cargo;

    // Senha é opcional. Se vier preenchida, altera.
    private String password;
}