package com.benfica.encomendas_api.controller;

import com.benfica.encomendas_api.dto.UsuarioResponseDTO;
import com.benfica.encomendas_api.dto.UsuarioUpdateDTO;
import com.benfica.encomendas_api.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioService usuarioService;

    @GetMapping("/me")
    public ResponseEntity<UsuarioResponseDTO> getMeuPerfil() {
        return ResponseEntity.ok(usuarioService.buscarPerfilLogado());
    }

    @PutMapping("/me")
    public ResponseEntity<UsuarioResponseDTO> atualizarMeuPerfil(@Valid @RequestBody UsuarioUpdateDTO dto) {
        return ResponseEntity.ok(usuarioService.atualizarPerfil(dto));
    }
}