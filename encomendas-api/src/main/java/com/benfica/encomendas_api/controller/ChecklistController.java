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
    public ResponseEntity<ChecklistBoardDTO> criarBoard(@RequestBody Map<String, Object> payload) {
        String nome = (String) payload.get("nome");
        UUID equipeId = UUID.fromString((String) payload.get("equipeId"));

        Long usuarioId = null;
        if (payload.containsKey("usuarioId") && payload.get("usuarioId") != null) {
            usuarioId = ((Number) payload.get("usuarioId")).longValue();
        }

        ChecklistBoardDTO board = checklistService.criarBoard(nome, equipeId, usuarioId);
        return ResponseEntity.ok(board);
    }

    @PostMapping("/cards")
    public ResponseEntity<ChecklistCardDTO> adicionarCard(@RequestBody Map<String, Object> payload) {
        UUID boardId = UUID.fromString((String) payload.get("boardId"));
        String titulo = (String) payload.get("titulo");
        String abre = (String) payload.get("horarioAbertura");
        String fecha = (String) payload.get("horarioFechamento");

        ChecklistCardDTO card = checklistService.adicionarCard(boardId, titulo,
                java.time.LocalTime.parse(abre),
                java.time.LocalTime.parse(fecha));

        return ResponseEntity.ok(card);
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
    public ResponseEntity<Void> moverCard(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> payload) {
        UUID boardId = UUID.fromString((String) payload.get("boardId"));
        checklistService.moverCard(id, boardId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/itens")
    public ResponseEntity<ChecklistItemDTO> adicionarItem(@RequestBody Map<String, Object> payload) {
        UUID cardId = UUID.fromString((String) payload.get("cardId"));
        String descricao = (String) payload.get("descricao");
        Integer ordem = (Integer) payload.get("ordem");

        return ResponseEntity.ok(checklistService.adicionarItem(cardId, descricao, ordem));
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