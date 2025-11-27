package com.benfica.encomendas_api.dto;

import com.benfica.encomendas_api.model.Convite;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class ConviteResponseDTO {
    private UUID id;
    private String emailDestino;
    private String status;
    private EquipeResponseDTO equipe; // Reutilizamos o DTO da equipe

    public static ConviteResponseDTO fromEntity(Convite convite) {
        return ConviteResponseDTO.builder()
                .id(convite.getId())
                .emailDestino(convite.getEmailDestino())
                .status(convite.getStatus())
                .equipe(EquipeResponseDTO.builder()
                        .id(convite.getEquipe().getId())
                        .nome(convite.getEquipe().getNome())
                        // Como o administrador é lazy, acessamos apenas se necessário,
                        // ou garantimos que a query traga junto (FETCH).
                        // Aqui assumimos que o acesso ao getAdministrador() dispara o load se a sessão estiver ativa.
                        .nomeAdministrador(convite.getEquipe().getAdministrador().getNomeCompleto())
                        .build())
                .build();
    }
}