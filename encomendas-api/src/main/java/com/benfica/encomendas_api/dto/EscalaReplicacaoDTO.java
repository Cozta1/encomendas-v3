package com.benfica.encomendas_api.dto;

import com.benfica.encomendas_api.model.TipoEscala;
import com.fasterxml.jackson.annotation.JsonFormat; // <--- Importante
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
public class EscalaReplicacaoDTO {
    private Long usuarioId;

    @JsonFormat(pattern = "yyyy-MM-dd") // Garante formato ISO
    private LocalDate dataInicio;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dataFim;

    private List<Integer> diasSemana;

    @JsonFormat(pattern = "HH:mm:ss") // Garante formato de hora
    private LocalTime horarioInicio;

    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime horarioFim;

    private TipoEscala tipo;
    private String observacao;
}