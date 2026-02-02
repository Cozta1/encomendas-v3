package com.benfica.encomendas_api.dto;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class EquipeResponseDTO {
    private UUID id;
    private String nome;
    private String descricao; // <-- CAMPO ADICIONADO (Essencial)
    private String nomeAdministrador;
    private boolean isMember;
    private boolean isAdmin;
}