package com.benfica.encomendas_api.dto;

import com.benfica.encomendas_api.model.Usuario;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor // Necessário para 'new UsuarioResponseDTO()'
@AllArgsConstructor // Torna o construtor do Builder público
public class UsuarioResponseDTO {
    private Long id;
    private String nomeCompleto;
    private String email;
    private String identificacao;
    private String cargo;
    private String role;
    private String telefone;
    private String nomeEquipe;
    private LocalDateTime dataCriacao;

    public static UsuarioResponseDTO fromEntity(Usuario usuario) {
        return UsuarioResponseDTO.builder()
                .id(usuario.getId())
                .nomeCompleto(usuario.getNomeCompleto())
                .email(usuario.getEmail())
                .identificacao(usuario.getIdentificacao())
                .cargo(usuario.getCargo())
                .role(usuario.getRole())
                .telefone(usuario.getTelefone())
                .nomeEquipe(usuario.getEquipe() != null ? usuario.getEquipe().getNome() : "Sem Equipe")
                .dataCriacao(usuario.getDataCriacao())
                .build();
    }
}