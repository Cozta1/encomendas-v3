package com.benfica.encomendas_api.dto;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class EquipeResponseDTO {
    private UUID id;
    private String nome;
    private String nomeAdministrador; // <-- Novo campo
    private boolean isMember; // Para saber se o user logado é admin ou membro
    private boolean isAdmin;
}