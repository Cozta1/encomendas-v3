package com.benfica.encomendas_api.dto;

import com.benfica.encomendas_api.model.Fornecedor; // Importar
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

    // --- NOVO MÉTODO ESTÁTICO ---
    public static FornecedorResponseDTO fromEntity(Fornecedor fornecedor) {
        // --- ADICIONADA VERIFICAÇÃO DE NULO ---
        if (fornecedor == null) {
            return null;
        }
        return FornecedorResponseDTO.builder()
                .id(fornecedor.getId())
                .nome(fornecedor.getNome())
                .cnpj(fornecedor.getCnpj())
                .contatoNome(fornecedor.getContatoNome())
                .telefone(fornecedor.getTelefone())
                .email(fornecedor.getEmail())
                .endereco(fornecedor.getEndereco())
                .build();
    }
}