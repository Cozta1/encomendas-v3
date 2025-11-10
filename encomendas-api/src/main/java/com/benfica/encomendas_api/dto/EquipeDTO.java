package com.benfica.encomendas_api.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class EquipeDTO {

    @NotBlank(message = "O nome da equipe é obrigatório")
    private String nome;

    private String descricao;
}