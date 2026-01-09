package com.benfica.encomendas_api.dto; //

import com.benfica.encomendas_api.model.Cliente;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Data
@Builder
public class ClienteResponseDTO {
    private UUID id;
    private String nome;
    private String codigoInterno; // <--- Novo campo no DTO de resposta
    private String cpf;
    private String email;
    private String telefone;
    private List<EnderecoDTO> enderecos;

    public static ClienteResponseDTO fromEntity(Cliente cliente) {
        return ClienteResponseDTO.builder()
                .id(cliente.getId())
                .nome(cliente.getNome())
                .codigoInterno(cliente.getCodigoInterno()) // <--- Mapeamento adicionado
                .cpf(cliente.getCpf())
                .email(cliente.getEmail())
                .telefone(cliente.getTelefone())
                .enderecos(cliente.getEnderecos().stream()
                        .map(EnderecoDTO::fromEntity)
                        .collect(Collectors.toList()))
                .build();
    }
}