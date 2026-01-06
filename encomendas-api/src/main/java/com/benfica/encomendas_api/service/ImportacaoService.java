package com.benfica.encomendas_api.service;

import com.benfica.encomendas_api.dto.ImportacaoDTO;
import com.benfica.encomendas_api.model.Cliente;
import com.benfica.encomendas_api.model.Endereco;
import com.benfica.encomendas_api.model.Equipe;
import com.benfica.encomendas_api.repository.ClienteRepository;
import com.benfica.encomendas_api.repository.EquipeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class ImportacaoService {

    @Autowired
    private EquipeRepository equipeRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Transactional
    public void importarDados(UUID equipeId, ImportacaoDTO dados) {
        Equipe equipe = equipeRepository.findById(equipeId)
                .orElseThrow(() -> new RuntimeException("Equipe não encontrada"));

        // Importar Clientes
        if (dados.getClientes() != null) {
            for (ImportacaoDTO.ClienteImportDTO dto : dados.getClientes()) {

                // Criação do Cliente
                Cliente cliente = Cliente.builder()
                        .equipe(equipe)
                        .nome(dto.getNome())
                        .email(dto.getEmail())
                        .telefone(dto.getTelefone())
                        .cpf(dto.getCpf())
                        .build();

                // Criação do Endereço (se houver dados de logradouro)
                if (dto.getLogradouro() != null) {
                    Endereco endereco = Endereco.builder()
                            .rua(dto.getLogradouro())
                            .numero(dto.getNumero() != null ? dto.getNumero() : "S/N")
                            // Bairro é obrigatório na sua entidade, então garantimos um valor
                            .bairro(dto.getBairro() != null ? dto.getBairro() : "Não informado")
                            .cidade(dto.getCidade())
                            .uf(dto.getEstado()) // CORREÇÃO: O campo na entidade é 'uf', não 'estado'
                            .cep(dto.getCep())
                            .complemento(dto.getComplemento())
                            .cliente(cliente)
                            .build();

                    // Adiciona o endereço à lista do cliente (bidirecional)
                    cliente.addEndereco(endereco);
                }

                // Salva o cliente (o CascadeType.ALL salvará o endereço automaticamente)
                clienteRepository.save(cliente);
            }
        }
    }
}