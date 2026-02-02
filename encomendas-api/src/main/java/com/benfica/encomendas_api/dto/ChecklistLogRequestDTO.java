package com.benfica.encomendas_api.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class ChecklistLogRequestDTO {
    private UUID itemId;
    private LocalDate dataReferencia; // O dia que ele está preenchendo (geralmente hoje)
    private Boolean valor; // true (marcou) ou false (desmarcou)
}