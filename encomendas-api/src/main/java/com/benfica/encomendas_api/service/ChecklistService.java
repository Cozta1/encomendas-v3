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
import java.time.format.DateTimeFormatter;
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

    private String calcularStatusRelatorioCard(
            List<ChecklistRelatorioDTO.RelatorioItemDTO> itens,
            ChecklistCard card,
            LocalDate data) {

        if (itens == null || itens.isEmpty()) return "SEM_ITENS";

        boolean todosCompletos = itens.stream().allMatch(ChecklistRelatorioDTO.RelatorioItemDTO::isMarcado);
        if (todosCompletos) return "CONCLUIDA";

        LocalDate hoje = LocalDate.now();
        if (data.isBefore(hoje)) return "FECHADA_INCOMPLETA";
        if (data.isAfter(hoje)) return "PENDENTE";

        // Today: check current time vs card window
        LocalTime agora = LocalTime.now();
        if (agora.isAfter(card.getHorarioFechamento())) return "FECHADA_INCOMPLETA";
        if (agora.isBefore(card.getHorarioAbertura())) return "PENDENTE";

        return "ABERTA";
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
    public void atualizarBoard(UUID boardId, Map<String, Object> payload) {
        ChecklistBoard board = boardRepository.findById(boardId)
                .orElseThrow(() -> new EntityNotFoundException("Board não encontrado"));
        if (payload.containsKey("nome")) {
            board.setNome((String) payload.get("nome"));
        }
        boardRepository.save(board);
    }

    @Transactional
    public void excluirBoard(UUID boardId) {
        ChecklistBoard board = boardRepository.findById(boardId)
                .orElseThrow(() -> new EntityNotFoundException("Board não encontrado"));
        for (ChecklistCard card : board.getCards()) {
            for (ChecklistItem item : card.getItens()) {
                logRepository.deleteAll(logRepository.findByItemIdOrderByDataHoraAcaoDesc(item.getId()));
            }
        }
        boardRepository.delete(board);
    }

    @Transactional
    public void atualizarCard(UUID cardId, Map<String, Object> payload) {
        ChecklistCard card = cardRepository.findById(cardId)
                .orElseThrow(() -> new EntityNotFoundException("Cartão não encontrado"));
        if (payload.containsKey("titulo")) {
            card.setTitulo((String) payload.get("titulo"));
        }
        if (payload.containsKey("descricao")) {
            card.setDescricao((String) payload.get("descricao"));
        }
        if (payload.containsKey("horarioAbertura")) {
            card.setHorarioAbertura(LocalTime.parse((String) payload.get("horarioAbertura")));
        }
        if (payload.containsKey("horarioFechamento")) {
            card.setHorarioFechamento(LocalTime.parse((String) payload.get("horarioFechamento")));
        }
        cardRepository.save(card);
    }

    @Transactional
    public void excluirCard(UUID cardId) {
        ChecklistCard card = cardRepository.findById(cardId)
                .orElseThrow(() -> new EntityNotFoundException("Card não encontrado"));
        for (ChecklistItem item : card.getItens()) {
            logRepository.deleteAll(logRepository.findByItemIdOrderByDataHoraAcaoDesc(item.getId()));
        }
        cardRepository.delete(card);
    }

    @Transactional
    public void moverCard(UUID cardId, UUID novoBoardId) {
        ChecklistCard card = cardRepository.findById(cardId)
                .orElseThrow(() -> new EntityNotFoundException("Card não encontrado"));
        ChecklistBoard board = boardRepository.findById(novoBoardId)
                .orElseThrow(() -> new EntityNotFoundException("Board não encontrado"));
        card.setBoard(board);
        cardRepository.save(card);
    }

    @Transactional
    public ChecklistItemDTO adicionarItem(UUID cardId, String descricao, Integer ordem) {
        ChecklistCard card = cardRepository.findById(cardId)
                .orElseThrow(() -> new EntityNotFoundException("Card não encontrado"));

        ChecklistItem item = ChecklistItem.builder()
                .descricao(descricao)
                .card(card)
                .ordem(ordem)
                .build();

        ChecklistItem salvo = itemRepository.save(item);
        return ChecklistItemDTO.builder()
                .id(salvo.getId())
                .descricao(salvo.getDescricao())
                .ordem(salvo.getOrdem())
                .marcado(false)
                .build();
    }

    @Transactional
    public void excluirItem(UUID itemId) {
        ChecklistItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new EntityNotFoundException("Item não encontrado"));
        logRepository.deleteAll(logRepository.findByItemIdOrderByDataHoraAcaoDesc(item.getId()));
        itemRepository.delete(item);
    }

    // --- REORDENAÇÃO CORRIGIDA (PERSISTÊNCIA GARANTIDA) ---

    @Transactional
    public void atualizarOrdemBoards(List<ReorderRequestDTO> lista) {
        List<UUID> ids = lista.stream()
                .filter(i -> i.getId() != null)
                .map(ReorderRequestDTO::getId)
                .collect(Collectors.toList());

        if (ids.isEmpty()) return;

        Map<UUID, Integer> ordemPorId = lista.stream()
                .filter(i -> i.getId() != null)
                .collect(Collectors.toMap(ReorderRequestDTO::getId, ReorderRequestDTO::getOrdem));

        List<ChecklistBoard> boards = boardRepository.findAllById(ids);
        boards.forEach(b -> b.setOrdem(ordemPorId.get(b.getId())));
        boardRepository.saveAll(boards);
    }

    @Transactional
    public void atualizarOrdemCards(List<ReorderRequestDTO> lista) {
        List<UUID> ids = lista.stream()
                .filter(i -> i.getId() != null)
                .map(ReorderRequestDTO::getId)
                .collect(Collectors.toList());

        if (ids.isEmpty()) return;

        Map<UUID, Integer> ordemPorId = lista.stream()
                .filter(i -> i.getId() != null)
                .collect(Collectors.toMap(ReorderRequestDTO::getId, ReorderRequestDTO::getOrdem));

        List<ChecklistCard> cards = cardRepository.findAllById(ids);
        cards.forEach(c -> c.setOrdem(ordemPorId.get(c.getId())));
        cardRepository.saveAll(cards);
    }

    // --- RELATÓRIO DE ATIVIDADES (Admin) ---

    @Transactional(readOnly = true)
    public ChecklistRelatorioDTO getRelatorio(UUID equipeId, LocalDate data) {
        // 1. Carrega equipe + membros (lazy load dentro da transação)
        Equipe equipe = equipeRepository.findById(equipeId)
                .orElseThrow(() -> new EntityNotFoundException("Equipe não encontrada"));
        List<Usuario> membros = equipe.getMembros();

        // 2. Carrega todos os boards da equipe (JOIN FETCH cards + @BatchSize para itens)
        List<ChecklistBoard> todosBoards = boardRepository.findByEquipeId(equipeId);

        // 3. Carrega todos os logs do dia para esta equipe
        List<ChecklistLog> logs = logRepository.findByEquipeIdAndDataReferencia(equipeId, data);

        // 4. Agrupa logs por (usuarioId, itemId) → apenas o último registro de cada par
        Map<String, ChecklistLog> ultimoLog = new HashMap<>();
        for (ChecklistLog log : logs) {
            String key = log.getUsuario().getId() + ":" + log.getItem().getId();
            ChecklistLog atual = ultimoLog.get(key);
            if (atual == null || log.getDataHoraAcao().isAfter(atual.getDataHoraAcao())) {
                ultimoLog.put(key, log);
            }
        }

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("HH:mm:ss");

        // 5. Constrói o relatório por usuário
        List<ChecklistRelatorioDTO.RelatorioUsuarioDTO> usuariosDTOs = membros.stream().map(membro -> {

            // Boards visíveis para este membro (gerais + os específicos dele)
            List<ChecklistBoard> boardsDoMembro = todosBoards.stream()
                    .filter(b -> b.getUsuarioEspecifico() == null
                              || b.getUsuarioEspecifico().getId().equals(membro.getId()))
                    .collect(Collectors.toList());

            List<ChecklistRelatorioDTO.RelatorioBoardDTO> boardDTOs = boardsDoMembro.stream().map(board -> {
                List<ChecklistRelatorioDTO.RelatorioCardDTO> cardDTOs = board.getCards().stream().map(card -> {
                    List<ChecklistRelatorioDTO.RelatorioItemDTO> itemDTOs = card.getItens().stream().map(item -> {
                        String key = membro.getId() + ":" + item.getId();
                        ChecklistLog lastLog = ultimoLog.get(key);
                        boolean marcado = lastLog != null && lastLog.getValor();
                        String hora = (marcado) ? lastLog.getDataHoraAcao().format(fmt) : null;

                        return ChecklistRelatorioDTO.RelatorioItemDTO.builder()
                                .descricao(item.getDescricao())
                                .marcado(marcado)
                                .horaPreenchimento(hora)
                                .build();
                    }).collect(Collectors.toList());

                    String statusCard = calcularStatusRelatorioCard(itemDTOs, card, data);

                    return ChecklistRelatorioDTO.RelatorioCardDTO.builder()
                            .cardTitulo(card.getTitulo())
                            .horarioAbertura(card.getHorarioAbertura().toString())
                            .horarioFechamento(card.getHorarioFechamento().toString())
                            .itens(itemDTOs)
                            .statusCard(statusCard)
                            .build();
                }).collect(Collectors.toList());

                return ChecklistRelatorioDTO.RelatorioBoardDTO.builder()
                        .boardNome(board.getNome())
                        .cards(cardDTOs)
                        .build();
            }).collect(Collectors.toList());

            int totalItens = boardDTOs.stream()
                    .mapToInt(b -> b.getCards().stream().mapToInt(c -> c.getItens().size()).sum())
                    .sum();
            int totalMarcados = boardDTOs.stream()
                    .mapToInt(b -> b.getCards().stream()
                            .mapToInt(c -> (int) c.getItens().stream()
                                    .filter(ChecklistRelatorioDTO.RelatorioItemDTO::isMarcado)
                                    .count())
                            .sum())
                    .sum();

            return ChecklistRelatorioDTO.RelatorioUsuarioDTO.builder()
                    .usuarioId(membro.getId())
                    .nomeUsuario(membro.getNomeCompleto())
                    .totalItens(totalItens)
                    .totalMarcados(totalMarcados)
                    .boards(boardDTOs)
                    .build();
        }).collect(Collectors.toList());

        return ChecklistRelatorioDTO.builder()
                .data(data)
                .usuarios(usuariosDTOs)
                .build();
    }
}