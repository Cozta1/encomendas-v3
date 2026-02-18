package com.benfica.encomendas_api.service;

import com.benfica.encomendas_api.dto.*;
import com.benfica.encomendas_api.model.*;
import com.benfica.encomendas_api.repository.*;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ChecklistService {

    @Autowired
    private ChecklistBoardRepository boardRepository;

    @Autowired
    private ChecklistCardRepository cardRepository;

    @Autowired
    private ChecklistItemRepository itemRepository;

    @Autowired
    private ChecklistLogRepository logRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private EquipeRepository equipeRepository;

    @Autowired
    private EscalaTrabalhoRepository escalaRepository;

    // --- VISÃO FUNCIONÁRIO: LEITURA DO DIA (Com validação de Escala) ---
    @Transactional(readOnly = true)
    public List<ChecklistBoardDTO> getChecklistDoDia(UUID equipeId, Long usuarioId, LocalDate dataReferencia) {

        // 1. REGRA DE NEGÓCIO: Verificar Escala
        if (usuarioId != null) {
            EscalaTrabalho escala = escalaRepository.findByUsuarioIdAndData(usuarioId, dataReferencia);

            // Se não tiver escala ou não for dia de trabalho, retorna vazio para o funcionário
            if (escala == null || escala.getTipo() != TipoEscala.TRABALHO) {
                return List.of();
            }
        }

        // 2. Busca os quadros da equipe (Geral + Individual do usuário)
        List<ChecklistBoard> boards = boardRepository.findByEquipeAndUsuario(equipeId, usuarioId);

        // 3. Busca histórico de logs do dia
        List<ChecklistLog> logsDoDia = (usuarioId != null)
                ? logRepository.findByUsuarioIdAndDataReferencia(usuarioId, dataReferencia)
                : List.of();

        // 4. Monta o DTO com status calculado e ORDENAÇÃO
        return boards.stream()
                // Garante que a lista venha ordenada do backend
                .sorted(Comparator.comparingInt(b -> b.getOrdem() != null ? b.getOrdem() : 9999))
                .map(board -> {
                    List<ChecklistCardDTO> cardsDTO = board.getCards().stream()
                            // Garante que os cards venham ordenados
                            .sorted(Comparator.comparingInt(c -> c.getOrdem() != null ? c.getOrdem() : 9999))
                            .map(card -> mapCardToDTO(card, logsDoDia, dataReferencia, true)) // true = calcula status
                            .collect(Collectors.toList());

                    return ChecklistBoardDTO.builder()
                            .id(board.getId())
                            .nome(board.getNome())
                            .equipeId(board.getEquipe().getId())
                            .usuarioEspecificoId(board.getUsuarioEspecifico() != null ? board.getUsuarioEspecifico().getId() : null)
                            .ordem(board.getOrdem())
                            .cards(cardsDTO)
                            .build();
                }).collect(Collectors.toList());
    }

    // --- VISÃO ADMIN: LISTAR TUDO (Ignora Escala) ---
    @Transactional(readOnly = true)
    public List<ChecklistBoardDTO> listarTodosBoards(UUID equipeId) {
        List<ChecklistBoard> boards = boardRepository.findByEquipeId(equipeId);

        return boards.stream()
                .sorted(Comparator.comparingInt(b -> b.getOrdem() != null ? b.getOrdem() : 9999))
                .map(board -> {
                    List<ChecklistCardDTO> cardsDTO = board.getCards().stream()
                            .sorted(Comparator.comparingInt(c -> c.getOrdem() != null ? c.getOrdem() : 9999))
                            .map(card -> mapCardToDTO(card, List.of(), LocalDate.now(), false))
                            .collect(Collectors.toList());

                    return ChecklistBoardDTO.builder()
                            .id(board.getId())
                            .nome(board.getNome())
                            .equipeId(board.getEquipe().getId())
                            .usuarioEspecificoId(board.getUsuarioEspecifico() != null ? board.getUsuarioEspecifico().getId() : null)
                            .ordem(board.getOrdem())
                            .cards(cardsDTO)
                            .build();
                }).collect(Collectors.toList());
    }

    // --- HELPER DE MAPEAMENTO ---
    private ChecklistCardDTO mapCardToDTO(ChecklistCard card, List<ChecklistLog> logsDoDia, LocalDate data, boolean calcularStatus) {
        String status = "CONFIG";
        if (calcularStatus) {
            status = calcularStatusCartao(card, data);
        }

        List<ChecklistItemDTO> itens = card.getItens().stream()
                .sorted(Comparator.comparingInt(i -> i.getOrdem() != null ? i.getOrdem() : 9999))
                .map(item -> {
                    boolean marcado = false;
                    if (calcularStatus) {
                        marcado = logsDoDia.stream()
                                .filter(log -> log.getItem().getId().equals(item.getId()))
                                .reduce((first, second) -> second)
                                .map(ChecklistLog::getValor)
                                .orElse(false);
                    }

                    return ChecklistItemDTO.builder()
                            .id(item.getId())
                            .descricao(item.getDescricao())
                            .ordem(item.getOrdem())
                            .marcado(marcado)
                            .build();
                }).collect(Collectors.toList());

        List<ChecklistAnexoDTO> anexosDTO = card.getAnexos().stream()
                .map(ChecklistAnexoDTO::fromEntity)
                .collect(Collectors.toList());

        return ChecklistCardDTO.builder()
                .id(card.getId())
                .titulo(card.getTitulo())
                .descricao(card.getDescricao())
                .anexos(anexosDTO)
                .horarioAbertura(card.getHorarioAbertura())
                .horarioFechamento(card.getHorarioFechamento())
                .itens(itens)
                .ordem(card.getOrdem())
                .status(status)
                .build();
    }

    private String calcularStatusCartao(ChecklistCard card, LocalDate dataReferencia) {
        LocalDate hoje = LocalDate.now();
        LocalTime agora = LocalTime.now();

        if (dataReferencia.isBefore(hoje)) return "HISTORICO";
        if (dataReferencia.isAfter(hoje)) return "PENDENTE";

        if (agora.isBefore(card.getHorarioAbertura())) return "PENDENTE";
        if (agora.isAfter(card.getHorarioFechamento())) return "FECHADO";
        return "ABERTO";
    }

    // --- AÇÕES E CRUD (Sem Alterações na Lógica) ---
    @Transactional
    public void registrarAcao(ChecklistLogRequestDTO request, Long usuarioId) {
        ChecklistItem item = itemRepository.findById(request.getItemId())
                .orElseThrow(() -> new EntityNotFoundException("Item não encontrado"));

        if (!request.getDataReferencia().isEqual(LocalDate.now())) {
            throw new IllegalArgumentException("Não é possível alterar checklists de outras datas.");
        }

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));

        ChecklistLog log = ChecklistLog.builder()
                .item(item)
                .usuario(usuario)
                .dataReferencia(request.getDataReferencia())
                .valor(request.getValor())
                .build();

        logRepository.save(log);
    }

    @Transactional
    public ChecklistBoardDTO criarBoard(String nome, UUID equipeId, Long usuarioIdEspecifico) {
        Equipe equipe = equipeRepository.findById(equipeId)
                .orElseThrow(() -> new EntityNotFoundException("Equipe não encontrada"));

        Usuario usuario = null;
        if (usuarioIdEspecifico != null) {
            usuario = usuarioRepository.findById(usuarioIdEspecifico)
                    .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));
        }

        ChecklistBoard board = ChecklistBoard.builder()
                .nome(nome)
                .equipe(equipe)
                .usuarioEspecifico(usuario)
                .ordem(9999)
                .build();

        ChecklistBoard salvo = boardRepository.save(board);

        return ChecklistBoardDTO.builder()
                .id(salvo.getId())
                .nome(salvo.getNome())
                .equipeId(salvo.getEquipe().getId())
                .usuarioEspecificoId(usuario != null ? usuario.getId() : null)
                .ordem(salvo.getOrdem())
                .cards(List.of())
                .build();
    }

    @Transactional
    public ChecklistCardDTO adicionarCard(UUID boardId, String titulo, LocalTime inicio, LocalTime fim) {
        ChecklistBoard board = boardRepository.findById(boardId)
                .orElseThrow(() -> new EntityNotFoundException("Board não encontrado"));

        ChecklistCard card = ChecklistCard.builder()
                .titulo(titulo)
                .board(board)
                .horarioAbertura(inicio)
                .horarioFechamento(fim)
                .ordem(9999)
                .build();

        ChecklistCard salvo = cardRepository.save(card);

        return ChecklistCardDTO.builder()
                .id(salvo.getId())
                .titulo(salvo.getTitulo())
                .horarioAbertura(salvo.getHorarioAbertura())
                .horarioFechamento(salvo.getHorarioFechamento())
                .itens(List.of())
                .anexos(List.of())
                .ordem(salvo.getOrdem())
                .build();
    }

    @Transactional
    public void atualizarDescricaoCard(UUID cardId, String novaDescricao) {
        ChecklistCard card = cardRepository.findById(cardId)
                .orElseThrow(() -> new EntityNotFoundException("Cartão não encontrado"));

        card.setDescricao(novaDescricao);
        cardRepository.save(card);
    }

    @Transactional
    public void adicionarItem(UUID cardId, String descricao, Integer ordem) {
        ChecklistCard card = cardRepository.findById(cardId)
                .orElseThrow(() -> new EntityNotFoundException("Card não encontrado"));

        ChecklistItem item = ChecklistItem.builder()
                .descricao(descricao)
                .card(card)
                .ordem(ordem)
                .build();

        itemRepository.save(item);
    }

    // --- REORDENAÇÃO CORRIGIDA (PERSISTÊNCIA GARANTIDA) ---

    @Transactional
    public void atualizarOrdemBoards(List<ReorderRequestDTO> lista) {
        List<ChecklistBoard> boardsParaSalvar = new ArrayList<>();

        for (ReorderRequestDTO item : lista) {
            if (item.getId() == null) continue;

            boardRepository.findById(item.getId()).ifPresent(board -> {
                board.setOrdem(item.getOrdem());
                boardsParaSalvar.add(board);
            });
        }
        // Salva todos de uma vez
        if (!boardsParaSalvar.isEmpty()) {
            boardRepository.saveAll(boardsParaSalvar);
        }
    }

    @Transactional
    public void atualizarOrdemCards(List<ReorderRequestDTO> lista) {
        List<ChecklistCard> cardsParaSalvar = new ArrayList<>();

        for (ReorderRequestDTO item : lista) {
            if (item.getId() == null) continue;

            cardRepository.findById(item.getId()).ifPresent(card -> {
                card.setOrdem(item.getOrdem());
                cardsParaSalvar.add(card);
            });
        }

        if (!cardsParaSalvar.isEmpty()) {
            cardRepository.saveAll(cardsParaSalvar);
        }
    }
}