package com.benfica.encomendas_api.controller;

import com.benfica.encomendas_api.dto.EquipeDTO;
import com.benfica.encomendas_api.dto.EquipeResponseDTO; // <-- IMPORTAR O NOVO DTO
import com.benfica.encomendas_api.model.Equipe;
import com.benfica.encomendas_api.service.EquipeService;
import com.benfica.encomendas_api.model.Usuario;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/equipes")
public class EquipeController {

    @Autowired
    private EquipeService equipeService;

    // MODIFICADO: Agora retorna o DTO
    @GetMapping
    public ResponseEntity<List<EquipeResponseDTO>> listarEquipesDoUsuario(@AuthenticationPrincipal Usuario usuarioLogado) {

        // (Pode remover os System.out.println de debug agora)

        List<EquipeResponseDTO> equipesDTO = equipeService.listarEquipesDoUsuario(usuarioLogado);
        return ResponseEntity.ok(equipesDTO);
    }

    @PostMapping
    public ResponseEntity<Equipe> criarEquipe(@Valid @RequestBody EquipeDTO dto,
                                              @AuthenticationPrincipal Usuario usuarioLogado) {
        Equipe novaEquipe = equipeService.criarEquipe(dto, usuarioLogado);
        return new ResponseEntity<>(novaEquipe, HttpStatus.CREATED);
    }
}