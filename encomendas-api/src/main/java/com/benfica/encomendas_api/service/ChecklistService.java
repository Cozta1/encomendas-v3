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
import java.util.List;
import java.util.UUID;
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

    // --- FUNCIONALIDADE 1: Montar a visão do dia (Renovação Diária) ---
    @Transactional(readOnly = true)
    public List<ChecklistBoardDTO> getChecklistDoDia(UUID equipeId, Long usuarioId, LocalDate dataReferencia) {
        // 1. Busca os quadros da equipe FILTRANDO por usuário (Geral + Individual)
        // Isso garante que o usuário veja os quadros de todos (null) + os dele (usuarioId)
        List<ChecklistBoard> boards = boardRepository.findByEquipeAndUsuario(equipeId, usuarioId);

        // 2. Busca o histórico de marcações deste usuário nesta data
        List<ChecklistLog> logsDoDia = logRepository.findByUsuarioIdAndDataReferencia(usuarioId, dataReferencia);

        // 3. Monta o DTO combinando estrutura + estado
        return boards.stream().map(board -> {
            List<ChecklistCardDTO> cardsDTO = board.getCards().stream()
                    .map(card -> mapCardToDTO(card, logsDoDia, dataReferencia)) // Método auxiliar
                    .collect(Collectors.toList());

            return ChecklistBoardDTO.builder()
                    .id(board.getId())
                    .nome(board.getNome())
                    .equipeId(board.getEquipe().getId())
                    .cards(cardsDTO)
                    .build();
        }).collect(Collectors.toList());
    }

    // Método auxiliar para montar o Card com status calculado
    private ChecklistCardDTO mapCardToDTO(ChecklistCard card, List<ChecklistLog> logsDoDia, LocalDate data) {
        String status = calcularStatusCartao(card, data);

        List<ChecklistItemDTO> itens = card.getItens().stream().map(item -> {
            // Verifica se está marcado no log do dia
            boolean marcado = logsDoDia.stream()
                    .filter(log -> log.getItem().getId().equals(item.getId()))
                    .reduce((first, second) -> second) // Pega o último log (mais recente)
                    .map(ChecklistLog::getValor)
                    .orElse(false);

            return ChecklistItemDTO.builder()
                    .id(item.getId())
                    .descricao(item.getDescricao())
                    .ordem(item.getOrdem())
                    .marcado(marcado)
                    .build();
        }).collect(Collectors.toList());

        return ChecklistCardDTO.builder()
                .id(card.getId())
                .titulo(card.getTitulo())
                .horarioAbertura(card.getHorarioAbertura())
                .horarioFechamento(card.getHorarioFechamento())
                .itens(itens)
                .status(status)
                .build();
    }

    // --- Lógica de Status (Cores e Bloqueios) ---
    private String calcularStatusCartao(ChecklistCard card, LocalDate dataReferencia) {
        LocalDate hoje = LocalDate.now();
        LocalTime agora = LocalTime.now();

        if (dataReferencia.isBefore(hoje)) {
            return "HISTORICO"; // Dias passados são apenas leitura
        } else if (dataReferencia.isAfter(hoje)) {
            return "PENDENTE"; // Futuro
        }

        // Validação de horário no dia atual
        if (agora.isBefore(card.getHorarioAbertura())) {
            return "PENDENTE";
        } else if (agora.isAfter(card.getHorarioFechamento())) {
            return "FECHADO";
        } else {
            return "ABERTO";
        }
    }

    // --- FUNCIONALIDADE 2: Marcar/Desmarcar (Log Imutável) ---
    @Transactional
    public void registrarAcao(ChecklistLogRequestDTO request, Long usuarioId) {
        ChecklistItem item = itemRepository.findById(request.getItemId())
                .orElseThrow(() -> new EntityNotFoundException("Item não encontrado"));

        ChecklistCard card = item.getCard();
        LocalTime agora = LocalTime.now();

        // Regra: Só pode editar se for o dia atual
        if (!request.getDataReferencia().isEqual(LocalDate.now())) {
            throw new IllegalArgumentException("Não é possível alterar checklists de outras datas.");
        }

        // Regra: Horário
        if (agora.isBefore(card.getHorarioAbertura()) || agora.isAfter(card.getHorarioFechamento())) {
            throw new IllegalArgumentException("Este cartão não está disponível neste horário.");
        }

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));

        // Cria novo Log (Insert only)
        ChecklistLog log = ChecklistLog.builder()
                .item(item)
                .usuario(usuario)
                .dataReferencia(request.getDataReferencia())
                .valor(request.getValor())
                .build();

        logRepository.save(log);
    }

    // --- FUNCIONALIDADE 3: Gestão de Estrutura (Admin) ---

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
                .usuarioEspecifico(usuario) // Define o dono (ou null para geral)
                .build();

        return mapBoardSimpleDTO(boardRepository.save(board));
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
                .build();

        // Retorno simplificado para o DTO de criação
        ChecklistCard salva = cardRepository.save(card);
        return ChecklistCardDTO.builder()
                .id(salva.getId())
                .titulo(salva.getTitulo())
                .horarioAbertura(salva.getHorarioAbertura())
                .horarioFechamento(salva.getHorarioFechamento())
                .build();
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

    private ChecklistBoardDTO mapBoardSimpleDTO(ChecklistBoard board) {
        return ChecklistBoardDTO.builder()
                .id(board.getId())
                .nome(board.getNome())
                .equipeId(board.getEquipe().getId())
                .build();
    }
}