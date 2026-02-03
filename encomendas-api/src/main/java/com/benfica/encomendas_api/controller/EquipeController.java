package com.benfica.encomendas_api.controller;

import com.benfica.encomendas_api.dto.ConviteResponseDTO;
import com.benfica.encomendas_api.dto.EquipeDTO;
import com.benfica.encomendas_api.dto.EquipeResponseDTO;
import com.benfica.encomendas_api.dto.MembroEquipeResponseDTO;
import com.benfica.encomendas_api.dto.UsuarioResponseDTO; // <--- Import Adicionado
import com.benfica.encomendas_api.model.Equipe;
import com.benfica.encomendas_api.model.Usuario;
import com.benfica.encomendas_api.service.EquipeService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/equipes")
public class EquipeController {

    @Autowired
    private EquipeService equipeService;

    @GetMapping
    public ResponseEntity<List<EquipeResponseDTO>> listarEquipesDoUsuario(@AuthenticationPrincipal Usuario usuarioLogado) {
        List<EquipeResponseDTO> equipesDTO = equipeService.listarEquipesDoUsuario(usuarioLogado);
        return ResponseEntity.ok(equipesDTO);
    }

    // Aceita ADMIN ou SUPER_ADMIN para criar equipes
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Equipe> criarEquipe(@Valid @RequestBody EquipeDTO dto,
                                              @AuthenticationPrincipal Usuario usuarioLogado) {
        Equipe novaEquipe = equipeService.criarEquipe(dto, usuarioLogado);
        return new ResponseEntity<>(novaEquipe, HttpStatus.CREATED);
    }

    // --- GESTÃO DE MEMBROS ---

    // Endpoint 1: Membros da equipe ATIVA (Contexto)
    @GetMapping("/membros")
    public ResponseEntity<List<MembroEquipeResponseDTO>> listarMembros() {
        return ResponseEntity.ok(equipeService.listarMembrosEquipeAtiva());
    }

    // Endpoint 2: Membros de uma equipe ESPECÍFICA (ID na URL)
    // Usado na Gestão de Escalas e no Criador de Checklists
    @GetMapping("/{id}/membros")
    public ResponseEntity<List<UsuarioResponseDTO>> getMembrosPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(equipeService.listarMembrosPorId(id));
    }

    @DeleteMapping("/membros/{usuarioId}")
    public ResponseEntity<Void> removerMembro(@PathVariable Long usuarioId,
                                              @AuthenticationPrincipal Usuario usuarioLogado) {
        // Agora passamos o usuarioLogado para validar se ele tem permissão (Admin da Equipe ou Super Admin)
        equipeService.removerMembro(usuarioId, usuarioLogado);
        return ResponseEntity.noContent().build();
    }

    // --- CONVITES ---

    @PostMapping("/{id}/convidar")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')") // Super Admin também pode convidar
    public ResponseEntity<?> convidarUsuario(@PathVariable UUID id,
                                             @RequestBody Map<String, String> payload,
                                             @AuthenticationPrincipal Usuario usuarioLogado) {
        String email = payload.get("email");
        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body("O email é obrigatório.");
        }
        equipeService.enviarConvite(id, email, usuarioLogado);
        return ResponseEntity.ok("Convite enviado com sucesso.");
    }

    @GetMapping("/{id}/convites")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<ConviteResponseDTO>> listarConvitesEnviados(@PathVariable UUID id,
                                                                           @AuthenticationPrincipal Usuario usuarioLogado) {
        List<ConviteResponseDTO> convites = equipeService.listarConvitesDaEquipe(id, usuarioLogado);
        return ResponseEntity.ok(convites);
    }

    @GetMapping("/meus-convites")
    public ResponseEntity<List<ConviteResponseDTO>> listarMeusConvites(@AuthenticationPrincipal Usuario usuarioLogado) {
        List<ConviteResponseDTO> convites = equipeService.listarConvitesPendentesDoUsuario(usuarioLogado.getEmail());
        return ResponseEntity.ok(convites);
    }

    @PostMapping("/convites/{conviteId}/aceitar")
    public ResponseEntity<?> aceitarConvite(@PathVariable UUID conviteId) {
        equipeService.aceitarConvite(conviteId);
        return ResponseEntity.ok("Convite aceito!");
    }
}