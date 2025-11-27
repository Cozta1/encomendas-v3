package com.benfica.encomendas_api.controller;

import com.benfica.encomendas_api.dto.ConviteResponseDTO; // Importar
import com.benfica.encomendas_api.dto.EquipeDTO;
import com.benfica.encomendas_api.dto.EquipeResponseDTO;
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

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Equipe> criarEquipe(@Valid @RequestBody EquipeDTO dto,
                                              @AuthenticationPrincipal Usuario usuarioLogado) {
        Equipe novaEquipe = equipeService.criarEquipe(dto, usuarioLogado);
        return new ResponseEntity<>(novaEquipe, HttpStatus.CREATED);
    }

    // --- ENDPOINTS DE CONVITE ---

    @PostMapping("/{id}/convidar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> convidarUsuario(@PathVariable UUID id, @RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body("O email é obrigatório.");
        }
        equipeService.enviarConvite(id, email);
        return ResponseEntity.ok("Convite enviado com sucesso.");
    }

    @GetMapping("/{id}/convites")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ConviteResponseDTO>> listarConvitesEnviados(@PathVariable UUID id) {
        // Retorna DTOs para evitar erro de serialização
        List<ConviteResponseDTO> convites = equipeService.listarConvitesDaEquipe(id);
        return ResponseEntity.ok(convites);
    }

    @GetMapping("/meus-convites")
    public ResponseEntity<List<ConviteResponseDTO>> listarMeusConvites(@AuthenticationPrincipal Usuario usuarioLogado) {
        // Retorna DTOs para evitar erro de serialização
        List<ConviteResponseDTO> convites = equipeService.listarConvitesPendentesDoUsuario(usuarioLogado.getEmail());
        return ResponseEntity.ok(convites);
    }

    @PostMapping("/convites/{conviteId}/aceitar")
    public ResponseEntity<?> aceitarConvite(@PathVariable UUID conviteId) {
        equipeService.aceitarConvite(conviteId);
        return ResponseEntity.ok("Convite aceito!");
    }
}