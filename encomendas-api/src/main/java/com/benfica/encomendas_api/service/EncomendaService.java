package com.benfica.encomendas_api.service;

import com.benfica.encomendas_api.dto.EncomendaRequestDTO;
import com.benfica.encomendas_api.dto.EncomendaResponseDTO;
import com.benfica.encomendas_api.model.*;
import com.benfica.encomendas_api.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class EncomendaService {

    private static final String STATUS_PENDENTE = "Pendente";
    private static final String STATUS_EM_PREPARO = "Em Preparo";
    private static final String STATUS_AGUARDANDO_ENTREGA = "Aguardando Entrega";
    private static final String STATUS_CONCLUIDO = "Concluído";
    private static final String STATUS_CANCELADO = "Cancelado";

    @Autowired
    private EncomendaRepository encomendaRepository;
    @Autowired
    private EncomendaItemRepository encomendaItemRepository;
    @Autowired
    private EquipeRepository equipeRepository;
    @Autowired
    private ClienteRepository clienteRepository;
    @Autowired
    private ProdutoRepository produtoRepository;
    @Autowired
    private FornecedorRepository fornecedorRepository;

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

        // 1. RESOLVER CLIENTE (Buscar existente ou Criar Novo)
        Cliente cliente = resolverCliente(dto.getCliente(), equipe);

        // 2. CONSTRUIR ENCOMENDA
        Encomenda encomenda = Encomenda.builder()
                .equipe(equipe)
                .cliente(cliente)
                .observacoes(dto.getObservacoes())
                // --- Endereço ---
                .enderecoCep(dto.getEnderecoCep())
                .enderecoBairro(dto.getEnderecoBairro())
                .enderecoRua(dto.getEnderecoRua())
                .enderecoNumero(dto.getEnderecoNumero())
                .enderecoComplemento(dto.getEnderecoComplemento())
                // --- Novos Campos ---
                .dataEstimadaEntrega(dto.getDataEstimadaEntrega())
                .notaFutura(dto.isNotaFutura())
                .vendaEstoqueNegativo(dto.isVendaEstoqueNegativo())
                // --- Valores ---
                .valorAdiantamento(dto.getValorAdiantamento() != null ? dto.getValorAdiantamento() : BigDecimal.ZERO)
                .status(STATUS_PENDENTE)
                .valorTotal(BigDecimal.ZERO)
                .build();

        encomenda = encomendaRepository.save(encomenda);

        // 3. PROCESSAR ITENS
        List<EncomendaItem> itens = new ArrayList<>();
        BigDecimal valorTotal = BigDecimal.ZERO;

        for (var itemDto : dto.getItens()) {
            Produto produto = resolverProduto(itemDto.getProduto(), equipe);
            Fornecedor fornecedor = resolverFornecedor(itemDto.getFornecedor(), equipe);

            BigDecimal precoCotado = itemDto.getPrecoCotado();
            BigDecimal quantidade = new BigDecimal(itemDto.getQuantidade());
            BigDecimal subtotal = precoCotado.multiply(quantidade);

            valorTotal = valorTotal.add(subtotal);

            EncomendaItem item = EncomendaItem.builder()
                    .encomenda(encomenda)
                    .produto(produto)
                    .fornecedor(fornecedor)
                    .quantidade(itemDto.getQuantidade())
                    .precoCotado(precoCotado)
                    .subtotal(subtotal)
                    .build();

            encomendaItemRepository.save(item);
            itens.add(item);
        }

        encomenda.setValorTotal(valorTotal);
        encomenda.setItens(itens);

        Encomenda salva = encomendaRepository.save(encomenda);
        return EncomendaResponseDTO.fromEntity(salva);
    }

    // --- MÉTODOS AUXILIARES (FIND OR CREATE) ---

    private Cliente resolverCliente(EncomendaRequestDTO.ClienteDataDTO dto, Equipe equipe) {

        // 1. Tenta buscar por CÓDIGO INTERNO (se informado) - PRIORIDADE
        if (dto.getCodigoInterno() != null && !dto.getCodigoInterno().trim().isEmpty()) {
            Optional<Cliente> existente = clienteRepository.findByEquipeId(equipe.getId()).stream()
                    .filter(c -> dto.getCodigoInterno().equalsIgnoreCase(c.getCodigoInterno()))
                    .findFirst();
            if (existente.isPresent()) return existente.get();
        }

        // 2. Tenta buscar por CPF dentro da equipe
        if (dto.getCpf() != null && !dto.getCpf().trim().isEmpty()) {
            Optional<Cliente> existente = clienteRepository.findByEquipeId(equipe.getId()).stream()
                    .filter(c -> dto.getCpf().equals(c.getCpf()))
                    .findFirst();

            if (existente.isPresent()) return existente.get();
        }

        // 3. Se não achou, cria novo com todos os dados
        Cliente novo = Cliente.builder()
                .equipe(equipe)
                .nome(dto.getNome())
                .codigoInterno(dto.getCodigoInterno()) // Salva o código interno
                .cpf(dto.getCpf())
                .email(dto.getEmail())
                .telefone(dto.getTelefone())
                .build();
        return clienteRepository.save(novo);
    }

    private Produto resolverProduto(EncomendaRequestDTO.ProdutoDataDTO dto, Equipe equipe) {
        if (dto.getCodigo() != null && !dto.getCodigo().trim().isEmpty()) {
            Optional<Produto> existente = produtoRepository.findByEquipeId(equipe.getId()).stream()
                    .filter(p -> dto.getCodigo().equals(p.getCodigo()))
                    .findFirst();

            if (existente.isPresent()) return existente.get();
        } else {
            Optional<Produto> existentePorNome = produtoRepository.findByEquipeId(equipe.getId()).stream()
                    .filter(p -> p.getNome().equalsIgnoreCase(dto.getNome()))
                    .findFirst();
            if (existentePorNome.isPresent()) return existentePorNome.get();
        }

        Produto novo = Produto.builder()
                .equipe(equipe)
                .nome(dto.getNome())
                .codigo(dto.getCodigo())
                .precoBase(BigDecimal.ZERO)
                .build();
        return produtoRepository.save(novo);
    }

    private Fornecedor resolverFornecedor(EncomendaRequestDTO.FornecedorDataDTO dto, Equipe equipe) {
        Optional<Fornecedor> existente = fornecedorRepository.findByEquipeId(equipe.getId()).stream()
                .filter(f -> f.getNome().equalsIgnoreCase(dto.getNome()))
                .findFirst();

        if (existente.isPresent()) return existente.get();

        Fornecedor novo = Fornecedor.builder()
                .equipe(equipe)
                .nome(dto.getNome())
                .build();
        return fornecedorRepository.save(novo);
    }

    // --- MÉTODOS DE GESTÃO DE ESTADO ---

    @Transactional
    public void removerEncomenda(UUID id, UUID equipeId) {
        Encomenda encomenda = buscarEValidarEncomenda(id, equipeId);
        encomendaRepository.delete(encomenda);
    }

    @Transactional
    public EncomendaResponseDTO avancarEtapa(UUID id, UUID equipeId) {
        Encomenda encomenda = buscarEValidarEncomenda(id, equipeId);
        if(encomenda.getStatus().equals(STATUS_CANCELADO)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cancelada.");
        switch (encomenda.getStatus()) {
            case STATUS_PENDENTE: encomenda.setStatus(STATUS_EM_PREPARO); break;
            case STATUS_EM_PREPARO: encomenda.setStatus(STATUS_AGUARDANDO_ENTREGA); break;
            case STATUS_AGUARDANDO_ENTREGA: encomenda.setStatus(STATUS_CONCLUIDO); break;
            case STATUS_CONCLUIDO: throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Já concluída.");
            default: throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status inválido.");
        }
        return EncomendaResponseDTO.fromEntity(encomendaRepository.save(encomenda));
    }

    @Transactional
    public EncomendaResponseDTO retornarEtapa(UUID id, UUID equipeId) {
        Encomenda encomenda = buscarEValidarEncomenda(id, equipeId);
        if(encomenda.getStatus().equals(STATUS_CANCELADO)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cancelada.");
        switch (encomenda.getStatus()) {
            case STATUS_CONCLUIDO: encomenda.setStatus(STATUS_AGUARDANDO_ENTREGA); break;
            case STATUS_AGUARDANDO_ENTREGA: encomenda.setStatus(STATUS_EM_PREPARO); break;
            case STATUS_EM_PREPARO: encomenda.setStatus(STATUS_PENDENTE); break;
            case STATUS_PENDENTE: throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Já está no início.");
        }
        return EncomendaResponseDTO.fromEntity(encomendaRepository.save(encomenda));
    }

    @Transactional
    public EncomendaResponseDTO cancelarEncomenda(UUID id, UUID equipeId) {
        Encomenda encomenda = buscarEValidarEncomenda(id, equipeId);
        if(encomenda.getStatus().equals(STATUS_CONCLUIDO)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Concluída não cancela.");
        encomenda.setStatus(STATUS_CANCELADO);
        return EncomendaResponseDTO.fromEntity(encomendaRepository.save(encomenda));
    }

    @Transactional
    public EncomendaResponseDTO descancelarEncomenda(UUID id, UUID equipeId) {
        Encomenda encomenda = buscarEValidarEncomenda(id, equipeId);
        if(!encomenda.getStatus().equals(STATUS_CANCELADO)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Não está cancelada.");
        encomenda.setStatus(STATUS_PENDENTE);
        return EncomendaResponseDTO.fromEntity(encomendaRepository.save(encomenda));
    }

    private Encomenda buscarEValidarEncomenda(UUID id, UUID equipeId) {
        Encomenda encomenda = encomendaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Encomenda não encontrada"));

        if (!encomenda.getEquipe().getId().equals(equipeId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso negado.");
        }
        return encomenda;
    }
}