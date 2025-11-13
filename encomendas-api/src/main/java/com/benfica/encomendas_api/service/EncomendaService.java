package com.benfica.encomendas_api.service;

import com.benfica.encomendas_api.dto.EncomendaRequestDTO;
import com.benfica.encomendas_api.dto.EncomendaResponseDTO;
import com.benfica.encomendas_api.model.*;
import com.benfica.encomendas_api.repository.ClienteRepository;
import com.benfica.encomendas_api.repository.EncomendaRepository;
import com.benfica.encomendas_api.repository.EquipeRepository;
import com.benfica.encomendas_api.repository.ProdutoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus; // IMPORTAR
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException; // IMPORTAR

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class EncomendaService {

    // (Status definidos como constantes para evitar erros de digitação)
    private static final String STATUS_PENDENTE = "PENDENTE";
    private static final String STATUS_EM_PREPARO = "EM_PREPARO";
    private static final String STATUS_CONCLUIDO = "CONCLUIDO";

    @Autowired
    private EncomendaRepository encomendaRepository;
    @Autowired
    private EquipeRepository equipeRepository;
    @Autowired
    private ClienteRepository clienteRepository;
    @Autowired
    private ProdutoRepository produtoRepository;

    @Transactional(readOnly = true)
    public List<EncomendaResponseDTO> listarEncomendasPorEquipe(UUID equipeId) {
        // (Método inalterado)
        return encomendaRepository.findByEquipeId(equipeId).stream()
                .map(EncomendaResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public EncomendaResponseDTO criarEncomenda(EncomendaRequestDTO dto, UUID equipeId) {
        // 1. Validar Entidades Principais
        Equipe equipe = equipeRepository.findById(equipeId)
                .orElseThrow(() -> new RuntimeException("Equipe não encontrada"));

        Cliente cliente = clienteRepository.findById(dto.getClienteId())
                .orElseThrow(() -> new RuntimeException("Cliente não encontrado"));

        if (!cliente.getEquipe().getId().equals(equipeId)) {
            throw new RuntimeException("Acesso negado: Cliente não pertence à sua equipe.");
        }

        // 2. Construir a Encomenda
        Encomenda encomenda = Encomenda.builder()
                .equipe(equipe)
                .cliente(cliente)
                .observacoes(dto.getObservacoes())
                .status(STATUS_PENDENTE) // Define o status inicial
                .valorTotal(BigDecimal.ZERO)
                .build();

        // 3. Processar e Validar Itens
        List<EncomendaItem> itens = new ArrayList<>();
        BigDecimal valorTotal = BigDecimal.ZERO;

        for (var itemDto : dto.getItens()) {
            Produto produto = produtoRepository.findById(itemDto.getProdutoId())
                    .orElseThrow(() -> new RuntimeException("Produto não encontrado: " + itemDto.getProdutoId()));

            if (!produto.getEquipe().getId().equals(equipeId)) {
                throw new RuntimeException("Acesso negado: Produto " + produto.getNome() + " não pertence à sua equipe.");
            }

            // 4. Calcular Subtotal e Total
            BigDecimal preco = produto.getPreco();
            BigDecimal quantidade = new BigDecimal(itemDto.getQuantidade());
            BigDecimal subtotal = preco.multiply(quantidade);

            valorTotal = valorTotal.add(subtotal);

            // 5. Construir o Item
            itens.add(EncomendaItem.builder()
                    .encomenda(encomenda)
                    .produto(produto)
                    .quantidade(itemDto.getQuantidade())
                    .precoUnitario(preco)
                    .subtotal(subtotal)
                    .build());
        }

        // 6. Finalizar e Salvar
        encomenda.setValorTotal(valorTotal);
        encomenda.setItens(itens);

        Encomenda salva = encomendaRepository.save(encomenda);
        return EncomendaResponseDTO.fromEntity(salva);
    }

    @Transactional
    public void removerEncomenda(UUID id, UUID equipeId) {
        // (Método inalterado)
        Encomenda encomenda = encomendaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Encomenda não encontrada com ID: " + id));

        if (!encomenda.getEquipe().getId().equals(equipeId)) {
            throw new RuntimeException("Acesso negado: Esta encomenda não pertence à sua equipe.");
        }

        encomendaRepository.delete(encomenda);
    }

    // --- NOVO MÉTODO ---
    @Transactional
    public EncomendaResponseDTO avancarEtapa(UUID id, UUID equipeId) {
        Encomenda encomenda = buscarEValidarEncomenda(id, equipeId);

        switch (encomenda.getStatus()) {
            case STATUS_PENDENTE:
                encomenda.setStatus(STATUS_EM_PREPARO);
                break;
            case STATUS_EM_PREPARO:
                encomenda.setStatus(STATUS_CONCLUIDO);
                break;
            case STATUS_CONCLUIDO:
                // Lança uma exceção que o frontend pode capturar
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Não é possível avançar uma encomenda concluída.");
            default:
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status desconhecido.");
        }

        Encomenda salva = encomendaRepository.save(encomenda);
        return EncomendaResponseDTO.fromEntity(salva);
    }

    // --- NOVO MÉTODO ---
    @Transactional
    public EncomendaResponseDTO retornarEtapa(UUID id, UUID equipeId) {
        Encomenda encomenda = buscarEValidarEncomenda(id, equipeId);

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

    // --- NOVO MÉTODO (HELPER) ---
    /**
     * Busca uma encomenda e valida se ela pertence à equipe ativa.
     */
    private Encomenda buscarEValidarEncomenda(UUID id, UUID equipeId) {
        Encomenda encomenda = encomendaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Encomenda não encontrada"));

        if (!encomenda.getEquipe().getId().equals(equipeId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso negado: Esta encomenda não pertence à sua equipe.");
        }
        return encomenda;
    }
}