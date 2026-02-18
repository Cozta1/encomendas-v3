package com.benfica.encomendas_api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReorderRequestDTO {
    private UUID id;
    private Integer ordem;
}