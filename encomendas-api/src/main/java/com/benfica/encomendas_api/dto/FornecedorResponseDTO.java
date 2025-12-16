package com.benfica.encomendas_api.dto;

import com.benfica.encomendas_api.model.Fornecedor;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Data
@Builder
public class FornecedorResponseDTO {
    private UUID id;
    private String nome;
    private String cnpj;
    private String email;
    private String telefone;
    private List<EnderecoDTO> enderecos;

    public static FornecedorResponseDTO fromEntity(Fornecedor fornecedor) {
        return FornecedorResponseDTO.builder()
                .id(fornecedor.getId())
                .nome(fornecedor.getNome())
                .cnpj(fornecedor.getCnpj())
                .email(fornecedor.getEmail())
                .telefone(fornecedor.getTelefone())
                .enderecos(fornecedor.getEnderecos().stream()
                        .map(EnderecoDTO::fromEntity)
                        .collect(Collectors.toList()))
                .build();
    }
}