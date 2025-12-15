package com.benfica.encomendas_api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class ClienteRequestDTO {
    @NotBlank(message = "O nome é obrigatório")
    private String nome;

    // --- NOVO CAMPO ---
    // Você pode adicionar @CPF se tiver a biblioteca Hibernate Validator BR,
    // por enquanto usaremos validação básica de string.
    private String cpf;
    // ------------------

    @NotBlank(message = "O email é obrigatório")
    @Email(message = "Email inválido")
    private String email;

    private String telefone;

    @Valid
    private List<EnderecoDTO> enderecos = new ArrayList<>();
}