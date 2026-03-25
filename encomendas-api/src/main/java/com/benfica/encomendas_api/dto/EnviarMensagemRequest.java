package com.benfica.encomendas_api.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EnviarMensagemRequest {

    @NotNull(message = "O ID da conversa é obrigatório")
    private UUID conversaId;

    // Conteúdo pode ser null/blank when there are only attachments, but capped to prevent DoS
    @Size(max = 4000, message = "A mensagem não pode exceder 4000 caracteres")
    private String conteudo;

    // Max 10 attachments per message to prevent abuse
    @Size(max = 10, message = "Máximo de 10 anexos por mensagem")
    private List<MensagemAnexoDTO> urlsAnexos;
}
