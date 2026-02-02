package com.benfica.encomendas_api.dto;

import com.benfica.encomendas_api.model.TipoEscala;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EscalaTrabalhoDTO {
    private Long id;
    private Long usuarioId;
    private String nomeUsuario; // Útil para exibir no calendário do admin
    private LocalDate data;
    private LocalTime horarioInicio;
    private LocalTime horarioFim;
    private TipoEscala tipo;
    private String observacao;
}