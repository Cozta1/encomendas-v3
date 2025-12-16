package com.benfica.encomendas_api.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MembroEquipeResponseDTO {
    private Long id;
    private String nomeCompleto;
    private String email;
    private String cargo;
    private String role;
}