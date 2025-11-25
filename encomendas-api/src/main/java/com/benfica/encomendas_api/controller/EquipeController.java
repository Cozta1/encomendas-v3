package com.benfica.encomendas_api.controller;

import com.benfica.encomendas_api.dto.EquipeDTO;
import com.benfica.encomendas_api.dto.EquipeResponseDTO;
import com.benfica.encomendas_api.model.Equipe;
import com.benfica.encomendas_api.service.EquipeService;
import com.benfica.encomendas_api.model.Usuario;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize; // Importar
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    // --- PROTEGIDO: APENAS ADMIN PODE CRIAR EQUIPES ---
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Equipe> criarEquipe(@Valid @RequestBody EquipeDTO dto,
                                              @AuthenticationPrincipal Usuario usuarioLogado) {
        Equipe novaEquipe = equipeService.criarEquipe(dto, usuarioLogado);
        return new ResponseEntity<>(novaEquipe, HttpStatus.CREATED);
    }
}