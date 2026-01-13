package com.benfica.encomendas_api.service;

import com.benfica.encomendas_api.dto.EncomendaRequestDTO;
import com.benfica.encomendas_api.dto.EncomendaResponseDTO;
import com.benfica.encomendas_api.model.*;
import com.benfica.encomendas_api.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class EncomendaService {

    private static final String STATUS_CRIADA = "Encomenda Criada";
    private static final String STATUS_NA_LOJA = "Mercadoria em Loja";
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

    @Transactional(readOnly = true)
    public EncomendaResponseDTO buscarPorId(UUID id, UUID equipeId) {
        Encomenda encomenda = buscarEValidarEncomenda(id, equipeId);
        return EncomendaResponseDTO.fromEntity(encomenda);
    }

    @Transactional
    public EncomendaResponseDTO criarEncomenda(EncomendaRequestDTO dto, UUID equipeId) {
        Equipe equipe = equipeRepository.findById(equipeId)
                .orElseThrow(() -> new RuntimeException("Equipe não encontrada"));

        Cliente cliente = resolverCliente(dto.getCliente(), equipe);

        Encomenda encomenda = Encomenda.builder()
                .equipe(equipe)
                .cliente(cliente)
                .observacoes(dto.getObservacoes())
                .enderecoCep(dto.getEnderecoCep())
                .enderecoBairro(dto.getEnderecoBairro())
                .enderecoRua(dto.getEnderecoRua())
                .enderecoNumero(dto.getEnderecoNumero())
                .enderecoComplemento(dto.getEnderecoComplemento())
                .dataEstimadaEntrega(dto.getDataEstimadaEntrega())
                .notaFutura(dto.getNotaFutura())
                .vendaEstoqueNegativo(dto.getVendaEstoqueNegativo())
                .valorAdiantamento(dto.getValorAdiantamento() != null ? dto.getValorAdiantamento() : BigDecimal.ZERO)
                .status(STATUS_CRIADA)
                .valorTotal(BigDecimal.ZERO)
                .build();

        // Inicializa e registra o primeiro histórico
        if (encomenda.getHistorico() == null) {
            encomenda.setHistorico(new ArrayList<>());
        }
        registrarHistorico(encomenda, STATUS_CRIADA);

        encomenda = encomendaRepository.save(encomenda);

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

    // --- MÉTODOS DE GESTÃO DE ESTADO COM HISTÓRICO ---

    @Transactional
    public EncomendaResponseDTO avancarEtapa(UUID id, UUID equipeId) {
        Encomenda encomenda = buscarEValidarEncomenda(id, equipeId);
        if(encomenda.getStatus().equals(STATUS_CANCELADO)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cancelada.");

        String novoStatus;
        switch (encomenda.getStatus()) {
            case STATUS_CRIADA: novoStatus = STATUS_NA_LOJA; break;
            case STATUS_NA_LOJA: novoStatus = STATUS_AGUARDANDO_ENTREGA; break;
            case STATUS_AGUARDANDO_ENTREGA: novoStatus = STATUS_CONCLUIDO; break;
            case STATUS_CONCLUIDO: throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Já concluída.");
            default: novoStatus = STATUS_NA_LOJA; // Fallback
        }

        encomenda.setStatus(novoStatus);
        registrarHistorico(encomenda, novoStatus);

        return EncomendaResponseDTO.fromEntity(encomendaRepository.save(encomenda));
    }

    @Transactional
    public EncomendaResponseDTO retornarEtapa(UUID id, UUID equipeId) {
        Encomenda encomenda = buscarEValidarEncomenda(id, equipeId);
        if(encomenda.getStatus().equals(STATUS_CANCELADO)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cancelada.");

        String novoStatus;
        switch (encomenda.getStatus()) {
            case STATUS_CONCLUIDO: novoStatus = STATUS_AGUARDANDO_ENTREGA; break;
            case STATUS_AGUARDANDO_ENTREGA: novoStatus = STATUS_NA_LOJA; break;
            case STATUS_NA_LOJA: novoStatus = STATUS_CRIADA; break;
            case STATUS_CRIADA: throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Já está no início.");
            default: novoStatus = STATUS_CRIADA;
        }

        encomenda.setStatus(novoStatus);
        registrarHistorico(encomenda, novoStatus);

        return EncomendaResponseDTO.fromEntity(encomendaRepository.save(encomenda));
    }

    @Transactional
    public EncomendaResponseDTO cancelarEncomenda(UUID id, UUID equipeId) {
        Encomenda encomenda = buscarEValidarEncomenda(id, equipeId);
        if(encomenda.getStatus().equals(STATUS_CONCLUIDO)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Concluída não cancela.");

        encomenda.setStatus(STATUS_CANCELADO);
        registrarHistorico(encomenda, STATUS_CANCELADO);

        return EncomendaResponseDTO.fromEntity(encomendaRepository.save(encomenda));
    }

    @Transactional
    public EncomendaResponseDTO descancelarEncomenda(UUID id, UUID equipeId) {
        Encomenda encomenda = buscarEValidarEncomenda(id, equipeId);
        if(!encomenda.getStatus().equals(STATUS_CANCELADO)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Não está cancelada.");

        encomenda.setStatus(STATUS_CRIADA);
        registrarHistorico(encomenda, STATUS_CRIADA);

        return EncomendaResponseDTO.fromEntity(encomendaRepository.save(encomenda));
    }

    @Transactional
    public void removerEncomenda(UUID id, UUID equipeId) {
        Encomenda encomenda = buscarEValidarEncomenda(id, equipeId);
        encomendaRepository.delete(encomenda);
    }

    // --- MÉTODOS AUXILIARES ---

    private void registrarHistorico(Encomenda encomenda, String status) {
        String usuarioLogado = "Sistema";
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser")) {
                usuarioLogado = auth.getName();
            }
        } catch (Exception e) {
            // Ignora erro em testes ou seed
        }

        EncomendaHistorico historico = EncomendaHistorico.builder()
                .encomenda(encomenda)
                .status(status)
                .dataAlteracao(LocalDateTime.now())
                .nomeUsuario(usuarioLogado)
                .build();

        if (encomenda.getHistorico() == null) {
            encomenda.setHistorico(new ArrayList<>());
        }
        encomenda.getHistorico().add(historico);
    }

    private Encomenda buscarEValidarEncomenda(UUID id, UUID equipeId) {
        Encomenda encomenda = encomendaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Encomenda não encontrada"));

        if (!encomenda.getEquipe().getId().equals(equipeId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso negado.");
        }
        return encomenda;
    }

    private Cliente resolverCliente(EncomendaRequestDTO.ClienteDataDTO dto, Equipe equipe) {
        if (dto.getCodigoInterno() != null && !dto.getCodigoInterno().trim().isEmpty()) {
            Optional<Cliente> existente = clienteRepository.findByEquipeId(equipe.getId()).stream()
                    .filter(c -> dto.getCodigoInterno().equalsIgnoreCase(c.getCodigoInterno()))
                    .findFirst();
            if (existente.isPresent()) return existente.get();
        }
        if (dto.getCpf() != null && !dto.getCpf().trim().isEmpty()) {
            Optional<Cliente> existente = clienteRepository.findByEquipeId(equipe.getId()).stream()
                    .filter(c -> dto.getCpf().equals(c.getCpf()))
                    .findFirst();
            if (existente.isPresent()) return existente.get();
        }
        Cliente novo = Cliente.builder()
                .equipe(equipe)
                .nome(dto.getNome())
                .codigoInterno(dto.getCodigoInterno())
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
}