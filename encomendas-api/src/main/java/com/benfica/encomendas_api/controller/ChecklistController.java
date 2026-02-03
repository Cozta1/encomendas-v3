package com.benfica.encomendas_api.controller;

import com.benfica.encomendas_api.dto.ChecklistBoardDTO;
import com.benfica.encomendas_api.dto.ChecklistCardDTO;
import com.benfica.encomendas_api.dto.ChecklistLogRequestDTO;
import com.benfica.encomendas_api.model.Usuario;
import com.benfica.encomendas_api.service.ChecklistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/checklists")
public class ChecklistController {

    @Autowired
    private ChecklistService checklistService;

    // --- LEITURA DO DIA (Funcionário ou Admin) ---
    // Retorna a estrutura completa + status para o dia solicitado
    @GetMapping("/dia")
    public ResponseEntity<List<ChecklistBoardDTO>> getChecklistDoDia(
            @RequestParam UUID equipeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data,
            @RequestParam(required = false) Long usuarioIdAlvo, // Para Admin ver de outro
            @AuthenticationPrincipal Usuario usuarioLogado
    ) {
        // Se data não for passada, assume hoje
        LocalDate dataRef = (data != null) ? data : LocalDate.now();

        // Se usuarioIdAlvo não for passado, vê o próprio logado
        Long idFinal = (usuarioIdAlvo != null) ? usuarioIdAlvo : usuarioLogado.getId();

        // O Service agora filtra por boards gerais E boards específicos desse usuário
        List<ChecklistBoardDTO> result = checklistService.getChecklistDoDia(equipeId, idFinal, dataRef);
        return ResponseEntity.ok(result);
    }

    // --- AÇÃO: Marcar/Desmarcar (Qualquer funcionário) ---
    @PostMapping("/log")
    public ResponseEntity<Void> registrarAcao(
            @RequestBody ChecklistLogRequestDTO request,
            @AuthenticationPrincipal Usuario usuarioLogado
    ) {
        checklistService.registrarAcao(request, usuarioLogado.getId());
        return ResponseEntity.ok().build();
    }

    // --- GESTÃO DA ESTRUTURA (Apenas ADMIN) ---

    @PostMapping("/boards")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ChecklistBoardDTO> criarBoard(@RequestBody Map<String, Object> payload) {
        String nome = (String) payload.get("nome");
        UUID equipeId = UUID.fromString((String) payload.get("equipeId"));

        // Extrai usuarioId se existir (para checklist individual)
        Long usuarioId = null;
        if (payload.containsKey("usuarioId") && payload.get("usuarioId") != null) {
            // Trata conversão de Integer (comum em JSON) para Long
            usuarioId = ((Number) payload.get("usuarioId")).longValue();
        }

        ChecklistBoardDTO board = checklistService.criarBoard(nome, equipeId, usuarioId);
        return ResponseEntity.ok(board);
    }

    @PostMapping("/cards")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ChecklistCardDTO> adicionarCard(@RequestBody Map<String, Object> payload) {
        UUID boardId = UUID.fromString((String) payload.get("boardId"));
        String titulo = (String) payload.get("titulo");

        // Parse de horário (Ex: "08:00")
        LocalTime inicio = LocalTime.parse((String) payload.get("horarioAbertura"));
        LocalTime fim = LocalTime.parse((String) payload.get("horarioFechamento"));

        ChecklistCardDTO card = checklistService.adicionarCard(boardId, titulo, inicio, fim);
        return ResponseEntity.ok(card);
    }

    @PostMapping("/itens")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> adicionarItem(@RequestBody Map<String, Object> payload) {
        UUID cardId = UUID.fromString((String) payload.get("cardId"));
        String descricao = (String) payload.get("descricao");
        Integer ordem = (Integer) payload.get("ordem");

        checklistService.adicionarItem(cardId, descricao, ordem);
        return ResponseEntity.ok().build();
    }
}