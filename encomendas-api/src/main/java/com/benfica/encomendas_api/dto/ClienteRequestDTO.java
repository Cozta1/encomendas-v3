package com.benfica.encomendas_api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ClienteRequestDTO {

    @NotBlank(message = "O nome é obrigatório")
    private String nome;

    private String telefone;

    @Email(message = "O formato do email é inválido")
    private String email;

    private String cpfCnpj;

    private String endereco;
}