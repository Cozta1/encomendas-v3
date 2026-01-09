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
    private EncomendaItemRepository encomendaItemRepository; // Necessário para salvar itens
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
                .valorTotal(BigDecimal.ZERO) // Será calculado abaixo
                .build();

        // Salva a encomenda primeiro para ter o ID (se necessário para cascade)
        // Mas como vamos salvar itens depois e atualizar o total, podemos salvar a entidade base agora.
        encomenda = encomendaRepository.save(encomenda);

        // 3. PROCESSAR ITENS
        List<EncomendaItem> itens = new ArrayList<>();
        BigDecimal valorTotal = BigDecimal.ZERO;

        for (var itemDto : dto.getItens()) {
            // Resolver Produto e Fornecedor
            Produto produto = resolverProduto(itemDto.getProduto(), equipe);
            Fornecedor fornecedor = resolverFornecedor(itemDto.getFornecedor(), equipe);

            BigDecimal precoCotado = itemDto.getPrecoCotado();
            BigDecimal quantidade = new BigDecimal(itemDto.getQuantidade());
            BigDecimal subtotal = precoCotado.multiply(quantidade);

            valorTotal = valorTotal.add(subtotal);

            // Cria o item vinculado à encomenda
            EncomendaItem item = EncomendaItem.builder()
                    .encomenda(encomenda)
                    .produto(produto)
                    .fornecedor(fornecedor)
                    .quantidade(itemDto.getQuantidade())
                    .precoCotado(precoCotado)
                    .subtotal(subtotal)
                    .build();

            // Salva item individualmente (ou poderia adicionar na lista e salvar via cascade se configurado)
            encomendaItemRepository.save(item);
            itens.add(item);
        }

        // Atualiza totais e lista de itens na encomenda
        encomenda.setValorTotal(valorTotal);
        encomenda.setItens(itens);

        Encomenda salva = encomendaRepository.save(encomenda);
        return EncomendaResponseDTO.fromEntity(salva);
    }

    // --- MÉTODOS AUXILIARES (FIND OR CREATE) ---

    private Cliente resolverCliente(EncomendaRequestDTO.ClienteDataDTO dto, Equipe equipe) {
        // Tenta buscar por CPF dentro da equipe
        if (dto.getCpf() != null && !dto.getCpf().trim().isEmpty()) {
            // OBS: Estamos usando stream para filtrar, garantindo funcionamento sem mudar o Repository agora.
            // O ideal seria: clienteRepository.findByCpfAndEquipe(dto.getCpf(), equipe)
            Optional<Cliente> existente = clienteRepository.findByEquipeId(equipe.getId()).stream()
                    .filter(c -> dto.getCpf().equals(c.getCpf()))
                    .findFirst();

            if (existente.isPresent()) return existente.get();
        }

        // Se não achou, cria novo
        Cliente novo = Cliente.builder()
                .equipe(equipe)
                .nome(dto.getNome())
                .cpf(dto.getCpf())
                .email(dto.getEmail())
                .telefone(dto.getTelefone())
                .build();
        return clienteRepository.save(novo);
    }

    private Produto resolverProduto(EncomendaRequestDTO.ProdutoDataDTO dto, Equipe equipe) {
        // Tenta buscar por Código dentro da equipe
        if (dto.getCodigo() != null && !dto.getCodigo().trim().isEmpty()) {
            Optional<Produto> existente = produtoRepository.findByEquipeId(equipe.getId()).stream()
                    .filter(p -> dto.getCodigo().equals(p.getCodigo()))
                    .findFirst();

            if (existente.isPresent()) return existente.get();
        } else {
            // Se não tem código, tenta buscar por Nome exato (para evitar duplicação óbvia)
            Optional<Produto> existentePorNome = produtoRepository.findByEquipeId(equipe.getId()).stream()
                    .filter(p -> p.getNome().equalsIgnoreCase(dto.getNome()))
                    .findFirst();
            if (existentePorNome.isPresent()) return existentePorNome.get();
        }

        // Cria novo
        Produto novo = Produto.builder()
                .equipe(equipe)
                .nome(dto.getNome())
                .codigo(dto.getCodigo())
                .precoBase(BigDecimal.ZERO) // Preço base zero, pois o preço real está no item da encomenda
                .build();
        return produtoRepository.save(novo);
    }

    private Fornecedor resolverFornecedor(EncomendaRequestDTO.FornecedorDataDTO dto, Equipe equipe) {
        // Busca por Nome exato na equipe
        Optional<Fornecedor> existente = fornecedorRepository.findByEquipeId(equipe.getId()).stream()
                .filter(f -> f.getNome().equalsIgnoreCase(dto.getNome()))
                .findFirst();

        if (existente.isPresent()) return existente.get();

        // Cria novo
        Fornecedor novo = Fornecedor.builder()
                .equipe(equipe)
                .nome(dto.getNome())
                // CNPJ/Email/Telefone ficam vazios se vierem do cadastro rápido manual
                .build();
        return fornecedorRepository.save(novo);
    }

    // --- MÉTODOS DE GESTÃO DE ESTADO (MANTIDOS) ---

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

        // Verifica se a equipe bate com a solicitada (segurança básica)
        if (!encomenda.getEquipe().getId().equals(equipeId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso negado.");
        }
        return encomenda;
    }
}