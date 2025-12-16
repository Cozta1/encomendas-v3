package com.benfica.encomendas_api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class FornecedorRequestDTO {

    @NotBlank(message = "O nome/razão social é obrigatório")
    private String nome;

    @NotBlank(message = "O CNPJ é obrigatório")
    private String cnpj;

    @NotBlank(message = "O email é obrigatório")
    @Email(message = "Email inválido")
    private String email;

    @NotBlank(message = "O telefone é obrigatório")
    private String telefone;

    @Valid
    private List<EnderecoDTO> enderecos = new ArrayList<>();
}