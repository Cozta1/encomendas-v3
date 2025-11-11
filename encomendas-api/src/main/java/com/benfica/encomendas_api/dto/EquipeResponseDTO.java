package com.benfica.encomendas_api.dto;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

// DTO simples que representa uma Equipe para o frontend
@Data
@Builder
public class EquipeResponseDTO {
    private UUID id;
    private String nome;
    // Não incluímos o 'administrador' para evitar o erro de serialização
}