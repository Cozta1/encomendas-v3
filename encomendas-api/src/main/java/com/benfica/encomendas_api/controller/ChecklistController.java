package com.benfica.encomendas_api.controller;

import com.benfica.encomendas_api.dto.*;
import com.benfica.encomendas_api.service.ChecklistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/checklists")
public class ChecklistController {

    @Autowired
    private ChecklistService checklistService;

    // --- VISÃO FUNCIONÁRIO (Depende da Escala) ---
    @GetMapping("/dia")
    public ResponseEntity<List<ChecklistBoardDTO>> getChecklistDoDia(
            @RequestParam UUID equipeId,
            @RequestParam(required = false) Long usuarioId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {

        if (data == null) data = LocalDate.now();
        List<ChecklistBoardDTO> boards = checklistService.getChecklistDoDia(equipeId, usuarioId, data);
        return ResponseEntity.ok(boards);
    }

    // --- VISÃO ADMIN (Lista tudo) ---
    @GetMapping("/boards")
    public ResponseEntity<List<ChecklistBoardDTO>> listarBoardsAdmin(@RequestParam UUID equipeId) {
        List<ChecklistBoardDTO> boards = checklistService.listarTodosBoards(equipeId);
        return ResponseEntity.ok(boards);
    }

    // --- AÇÕES (Logs) ---
    @PostMapping("/log")
    public ResponseEntity<Void> registrarAcao(
            @RequestBody ChecklistLogRequestDTO request,
            @RequestParam(required = false) Long usuarioId) {

        if (usuarioId == null) throw new IllegalArgumentException("Usuario ID é obrigatório");
        checklistService.registrarAcao(request, usuarioId);
        return ResponseEntity.ok().build();
    }

    // --- ESTRUTURA (Admin) ---

    @PostMapping("/boards")
    public ResponseEntity<?> criarBoard(@RequestBody Map<String, Object> payload) {
        Object nomeObj = payload.get("nome");
        Object equipeIdObj = payload.get("equipeId");
        if (nomeObj == null || equipeIdObj == null) {
            return ResponseEntity.badRequest().body("Campos 'nome' e 'equipeId' são obrigatórios.");
        }

        String nome = nomeObj.toString().trim();
        if (nome.isEmpty()) {
            return ResponseEntity.badRequest().body("Nome do board não pode ser vazio.");
        }

        UUID equipeId;
        try {
            equipeId = UUID.fromString(equipeIdObj.toString());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("equipeId inválido.");
        }

        Long usuarioId = null;
        if (payload.containsKey("usuarioId") && payload.get("usuarioId") != null) {
            usuarioId = ((Number) payload.get("usuarioId")).longValue();
        }

        ChecklistBoardDTO board = checklistService.criarBoard(nome, equipeId, usuarioId);
        return ResponseEntity.ok(board);
    }

    @PostMapping("/cards")
    public ResponseEntity<?> adicionarCard(@RequestBody Map<String, Object> payload) {
        Object boardIdObj = payload.get("boardId");
        Object tituloObj = payload.get("titulo");
        Object abreObj = payload.get("horarioAbertura");
        Object fechaObj = payload.get("horarioFechamento");

        if (boardIdObj == null || tituloObj == null || abreObj == null || fechaObj == null) {
            return ResponseEntity.badRequest().body("Campos 'boardId', 'titulo', 'horarioAbertura' e 'horarioFechamento' são obrigatórios.");
        }

        UUID boardId;
        try {
            boardId = UUID.fromString(boardIdObj.toString());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("boardId inválido.");
        }

        try {
            ChecklistCardDTO card = checklistService.adicionarCard(boardId, tituloObj.toString(),
                    java.time.LocalTime.parse(abreObj.toString()),
                    java.time.LocalTime.parse(fechaObj.toString()));
            return ResponseEntity.ok(card);
        } catch (java.time.format.DateTimeParseException e) {
            return ResponseEntity.badRequest().body("Formato de horário inválido. Use HH:mm.");
        }
    }

    @PatchMapping("/boards/{id}")
    public ResponseEntity<Void> atualizarBoard(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> payload) {
        checklistService.atualizarBoard(id, payload);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/boards/{id}")
    public ResponseEntity<Void> excluirBoard(@PathVariable UUID id) {
        checklistService.excluirBoard(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/cards/{id}")
    public ResponseEntity<Void> atualizarCard(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> payload) {
        checklistService.atualizarCard(id, payload);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/cards/{id}")
    public ResponseEntity<Void> excluirCard(@PathVariable UUID id) {
        checklistService.excluirCard(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/cards/{id}/mover")
    public ResponseEntity<?> moverCard(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> payload) {
        Object boardIdObj = payload.get("boardId");
        if (boardIdObj == null) {
            return ResponseEntity.badRequest().body("Campo 'boardId' é obrigatório.");
        }
        try {
            UUID boardId = UUID.fromString(boardIdObj.toString());
            checklistService.moverCard(id, boardId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("boardId inválido.");
        }
    }

    @PostMapping("/itens")
    public ResponseEntity<?> adicionarItem(@RequestBody Map<String, Object> payload) {
        Object cardIdObj = payload.get("cardId");
        Object descricaoObj = payload.get("descricao");
        Object ordemObj = payload.get("ordem");

        if (cardIdObj == null || descricaoObj == null) {
            return ResponseEntity.badRequest().body("Campos 'cardId' e 'descricao' são obrigatórios.");
        }

        UUID cardId;
        try {
            cardId = UUID.fromString(cardIdObj.toString());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("cardId inválido.");
        }

        Integer ordem = ordemObj instanceof Number ? ((Number) ordemObj).intValue() : null;
        return ResponseEntity.ok(checklistService.adicionarItem(cardId, descricaoObj.toString(), ordem));
    }

    @DeleteMapping("/itens/{id}")
    public ResponseEntity<Void> excluirItem(@PathVariable UUID id) {
        checklistService.excluirItem(id);
        return ResponseEntity.noContent().build();
    }

    // --- RELATÓRIO DE ATIVIDADES (Admin) ---
    @GetMapping("/relatorio")
    public ResponseEntity<ChecklistRelatorioDTO> getRelatorio(
            @RequestParam UUID equipeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {

        if (data == null) data = LocalDate.now();
        return ResponseEntity.ok(checklistService.getRelatorio(equipeId, data));
    }

    // --- REORDENAÇÃO (Endpoints Otimizados com DTO) ---

    @PutMapping("/boards/reordenar")
    public ResponseEntity<Void> reordenarBoards(@RequestBody List<ReorderRequestDTO> ordemBoards) {
        checklistService.atualizarOrdemBoards(ordemBoards);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/cards/reordenar")
    public ResponseEntity<Void> reordenarCards(@RequestBody List<ReorderRequestDTO> ordemCards) {
        checklistService.atualizarOrdemCards(ordemCards);
        return ResponseEntity.ok().build();
    }
}