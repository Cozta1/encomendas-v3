package com.benfica.encomendas_api.dto;

import com.benfica.encomendas_api.model.Endereco;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnderecoDTO {
    private UUID id;

    @NotBlank(message = "CEP é obrigatório")
    private String cep;

    @NotBlank(message = "Bairro é obrigatório")
    private String bairro;

    @NotBlank(message = "Rua é obrigatória")
    private String rua;

    @NotBlank(message = "Número é obrigatório")
    private String numero;

    private String complemento;
    private String cidade;
    private String uf;

    public static EnderecoDTO fromEntity(Endereco e) {
        return EnderecoDTO.builder()
                .id(e.getId())
                .cep(e.getCep())
                .bairro(e.getBairro())
                .rua(e.getRua())
                .numero(e.getNumero())
                .complemento(e.getComplemento())
                .cidade(e.getCidade())
                .uf(e.getUf())
                .build();
    }
}