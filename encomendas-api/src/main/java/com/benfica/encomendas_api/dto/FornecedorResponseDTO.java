package com.benfica.encomendas_api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FornecedorResponseDTO {
    private UUID id;
    private String nome;
    private String cnpj;
    private String contatoNome;
    private String telefone;
    private String email;
    private String endereco;
}