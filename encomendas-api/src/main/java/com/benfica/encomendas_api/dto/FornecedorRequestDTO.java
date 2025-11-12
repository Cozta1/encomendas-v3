package com.benfica.encomendas_api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FornecedorRequestDTO {

    @NotBlank(message = "O nome é obrigatório")
    private String nome;

    private String cnpj;

    private String contatoNome;

    private String telefone;

    @Email(message = "Formato de email inválido")
    private String email;

    private String endereco;
}