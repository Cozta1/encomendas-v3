package com.benfica.encomendas_api.service;

import com.benfica.encomendas_api.dto.EncomendaRequestDTO;
import com.benfica.encomendas_api.dto.EncomendaResponseDTO;
import com.benfica.encomendas_api.model.*;
import com.benfica.encomendas_api.repository.*; // 1. Importar todos os repositórios
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class EncomendaService {

    private static final String STATUS_PENDENTE = "Pendente";
    private static final String STATUS_EM_PREPARO = "Em preparo";
    private static final String STATUS_ENTREGA = "Aguardando entrega";
    private static final String STATUS_CONCLUIDO = "Concluido";

    private static final String STATUS_CANCELADO = "Cancelado";

    @Autowired
    private EncomendaRepository encomendaRepository;
    @Autowired
    private EquipeRepository equipeRepository;
    @Autowired
    private ClienteRepository clienteRepository;
    @Autowired
    private ProdutoRepository produtoRepository;
    @Autowired
    private FornecedorRepository fornecedorRepository; // 2. Injetar FornecedorRepository

    @Transactional(readOnly = true)
    public List<EncomendaResponseDTO> listarEncomendasPorEquipe(UUID equipeId) {
        return encomendaRepository.findByEquipeId(equipeId).stream()
                .map(EncomendaResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public EncomendaResponseDTO criarEncomenda(EncomendaRequestDTO dto, UUID equipeId) {
        Equipe equipe = equipeRepository.findById(equipeId)
                .orElseThrow(() -> new RuntimeException("Equipe não encontrada"));

        Cliente cliente = clienteRepository.findById(dto.getClienteId())
                .orElseThrow(() -> new RuntimeException("Cliente não encontrado"));

        if (!cliente.getEquipe().getId().equals(equipeId)) {
            throw new RuntimeException("Acesso negado: Cliente não pertence à sua equipe.");
        }

        Encomenda encomenda = Encomenda.builder()
                .equipe(equipe)
                .cliente(cliente)
                .observacoes(dto.getObservacoes())
                .status(STATUS_PENDENTE)
                .valorTotal(BigDecimal.ZERO)
                .build();

        List<EncomendaItem> itens = new ArrayList<>();
        BigDecimal valorTotal = BigDecimal.ZERO;

        // --- 3. LÓGICA DE CRIAÇÃO DE ITEM ATUALIZADA ---
        for (var itemDto : dto.getItens()) {
            Produto produto = produtoRepository.findById(itemDto.getProdutoId())
                    .orElseThrow(() -> new RuntimeException("Produto não encontrado: " + itemDto.getProdutoId()));

            if (!produto.getEquipe().getId().equals(equipeId)) {
                throw new RuntimeException("Acesso negado: Produto " + produto.getNome() + " não pertence à sua equipe.");
            }

            Fornecedor fornecedor = fornecedorRepository.findById(itemDto.getFornecedorId())
                    .orElseThrow(() -> new RuntimeException("Fornecedor não encontrado: " + itemDto.getFornecedorId()));

            if (!fornecedor.getEquipe().getId().equals(equipeId)) {
                throw new RuntimeException("Acesso negado: Fornecedor " + fornecedor.getNome() + " não pertence à sua equipe.");
            }

            // Usa o preço cotado enviado pelo frontend
            BigDecimal precoCotado = itemDto.getPrecoCotado();
            BigDecimal quantidade = new BigDecimal(itemDto.getQuantidade());
            BigDecimal subtotal = precoCotado.multiply(quantidade);

            valorTotal = valorTotal.add(subtotal);

            itens.add(EncomendaItem.builder()
                    .encomenda(encomenda)
                    .produto(produto)
                    .fornecedor(fornecedor) // Adiciona o fornecedor
                    .quantidade(itemDto.getQuantidade())
                    .precoCotado(precoCotado) // Salva o preço cotado
                    .subtotal(subtotal)
                    .build());
        }
        // --- FIM DA LÓGICA ATUALIZADA ---

        encomenda.setValorTotal(valorTotal);
        encomenda.setItens(itens);

        Encomenda salva = encomendaRepository.save(encomenda);
        return EncomendaResponseDTO.fromEntity(salva);
    }

    @Transactional
    public void removerEncomenda(UUID id, UUID equipeId) {
        Encomenda encomenda = buscarEValidarEncomenda(id, equipeId);
        encomendaRepository.delete(encomenda);
    }

    @Transactional
    public EncomendaResponseDTO avancarEtapa(UUID id, UUID equipeId) {
        Encomenda encomenda = buscarEValidarEncomenda(id, equipeId);

        if (encomenda.getStatus().equals(STATUS_CANCELADO)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Não é possível avançar uma encomenda cancelada.");
        }

        switch (encomenda.getStatus()) {
            case STATUS_PENDENTE:
                encomenda.setStatus(STATUS_EM_PREPARO);
                break;
            case STATUS_EM_PREPARO:
                encomenda.setStatus(STATUS_ENTREGA);
                break;
            case STATUS_ENTREGA:
                encomenda.setStatus(STATUS_CONCLUIDO);
                break;
            case STATUS_CONCLUIDO:
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Não é possível avançar uma encomenda concluída.");
            default:
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status desconhecido.");
        }

        Encomenda salva = encomendaRepository.save(encomenda);
        return EncomendaResponseDTO.fromEntity(salva);
    }

    @Transactional
    public EncomendaResponseDTO retornarEtapa(UUID id, UUID equipeId) {
        Encomenda encomenda = buscarEValidarEncomenda(id, equipeId);

        if (encomenda.getStatus().equals(STATUS_CANCELADO)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Não é possível retornar uma encomenda cancelada.");
        }

        switch (encomenda.getStatus()) {
            case STATUS_CONCLUIDO:
                encomenda.setStatus(STATUS_EM_PREPARO);
                break;
            case STATUS_EM_PREPARO:
                encomenda.setStatus(STATUS_PENDENTE);
                break;
            case STATUS_PENDENTE:
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Não é possível retornar uma encomenda pendente.");
            default:
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status desconhecido.");
        }

        Encomenda salva = encomendaRepository.save(encomenda);
        return EncomendaResponseDTO.fromEntity(salva);
    }

    @Transactional
    public EncomendaResponseDTO cancelarEncomenda(UUID id, UUID equipeId) {
        Encomenda encomenda = buscarEValidarEncomenda(id, equipeId);

        if (encomenda.getStatus().equals(STATUS_CONCLUIDO)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Não é possível cancelar uma encomenda concluída.");
        }

        if (encomenda.getStatus().equals(STATUS_CANCELADO)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Encomenda já está cancelada.");
        }

        encomenda.setStatus(STATUS_CANCELADO);
        Encomenda salva = encomendaRepository.save(encomenda);
        return EncomendaResponseDTO.fromEntity(salva);
    }

    private Encomenda buscarEValidarEncomenda(UUID id, UUID equipeId) {
        Encomenda encomenda = encomendaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Encomenda não encontrada"));

        if (!encomenda.getEquipe().getId().equals(equipeId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso negado: Esta encomenda não pertence à sua equipe.");
        }
        return encomenda;
    }
}