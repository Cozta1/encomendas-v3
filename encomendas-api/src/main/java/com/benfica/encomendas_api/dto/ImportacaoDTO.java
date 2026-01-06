package com.benfica.encomendas_api.dto;

import lombok.Data;
import java.util.List;

@Data
public class ImportacaoDTO {
    // Lista de clientes para importar
    private List<ClienteImportDTO> clientes;

    @Data
    public static class ClienteImportDTO {
        private String nome;
        private String email;
        private String telefone;
        private String cpf;

        // Dados de Endereço
        private String logradouro; // Mapeia para 'rua'
        private String numero;
        private String bairro;     // Obrigatório no banco
        private String cidade;
        private String estado;     // Mapeia para 'uf'
        private String cep;
        private String complemento;
    }
}