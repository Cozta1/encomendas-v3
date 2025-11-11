package com.benfica.encomendas_api.dto;

import com.benfica.encomendas_api.model.Cliente;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClienteResponseDTO {

    private UUID id;
    private String nome;
    private String telefone;
    private String email;
    private String cpfCnpj;
    private String endereco;

    /**
     * Método helper para converter a Entidade Cliente em um DTO de Resposta.
     */
    public static ClienteResponseDTO fromEntity(Cliente cliente) {
        return ClienteResponseDTO.builder()
                .id(cliente.getId())
                .nome(cliente.getNome())
                .telefone(cliente.getTelefone())
                .email(cliente.getEmail())
                .cpfCnpj(cliente.getCpfCnpj())
                .endereco(cliente.getEndereco())
                .build();
    }
}