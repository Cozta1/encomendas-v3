package com.benfica.encomendas_api.controller;

import com.benfica.encomendas_api.dto.ImportacaoDTO;
import com.benfica.encomendas_api.service.ImportacaoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/integracao")
public class ImportacaoController {

    @Autowired
    private ImportacaoService importacaoService;

    // Apenas Admin da Equipe ou Super Admin podem importar
    @PostMapping("/importar/{equipeId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    public ResponseEntity<?> importarDados(@PathVariable UUID equipeId, @RequestBody ImportacaoDTO dados) {
        try {
            importacaoService.importarDados(equipeId, dados);
            return ResponseEntity.ok("Dados importados com sucesso para a equipe.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erro na importação: " + e.getMessage());
        }
    }
}