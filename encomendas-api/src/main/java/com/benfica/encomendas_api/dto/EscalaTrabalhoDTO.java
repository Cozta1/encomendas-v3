package com.benfica.encomendas_api.dto;

import com.benfica.encomendas_api.model.TipoEscala;
import com.fasterxml.jackson.annotation.JsonFormat;
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
    private String nomeUsuario;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate data;

    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime horarioInicio;

    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime horarioFim;

    private TipoEscala tipo;
    private String observacao;
}