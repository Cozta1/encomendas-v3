package com.benfica.encomendas_api.dto;

import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChecklistRelatorioDTO {

    private LocalDate data;
    private List<RelatorioUsuarioDTO> usuarios;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RelatorioUsuarioDTO {
        private Long usuarioId;
        private String nomeUsuario;
        private int totalItens;
        private int totalMarcados;
        private List<RelatorioBoardDTO> boards;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RelatorioBoardDTO {
        private String boardNome;
        private List<RelatorioCardDTO> cards;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RelatorioCardDTO {
        private String cardTitulo;
        private String horarioAbertura;
        private String horarioFechamento;
        private List<RelatorioItemDTO> itens;
        private String statusCard; // CONCLUIDA | ABERTA | FECHADA_INCOMPLETA | PENDENTE | SEM_ITENS
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RelatorioItemDTO {
        private String descricao;
        private boolean marcado;
        private String horaPreenchimento; // null se não marcado
    }
}
