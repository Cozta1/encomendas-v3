package com.benfica.encomendas_api.controller;

import com.benfica.encomendas_api.dto.SupportTicketRequest;
import com.benfica.encomendas_api.service.EmailService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/support")
public class SupportController {

    @Autowired
    private EmailService emailService;

    @Value("${app.support.dev-email:}")
    private String devEmail;

    @PostMapping("/ticket")
    public ResponseEntity<Void> enviarTicket(@Valid @RequestBody SupportTicketRequest req) {
        String timestamp = LocalDateTime.now()
                .format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"));

        String assunto = String.format("[TICKET] [%s] %s", req.getCategoria(), req.getTitulo());

        String corpo = String.format(
                "=========================================\n" +
                "  TICKET DE SUPORTE — SISTEMA ENCOMENDAS\n" +
                "=========================================\n\n" +
                "Data/Hora : %s\n" +
                "Usuário   : %s\n" +
                "Equipe    : %s\n\n" +
                "-----------------------------------------\n" +
                "Categoria : %s\n" +
                "Título    : %s\n" +
                "-----------------------------------------\n\n" +
                "DESCRIÇÃO:\n\n%s\n\n" +
                "=========================================\n",
                timestamp,
                req.getNomeUsuario() != null ? req.getNomeUsuario() : "Desconhecido",
                req.getEquipeNome() != null ? req.getEquipeNome() : "N/A",
                req.getCategoria(),
                req.getTitulo(),
                req.getDescricao()
        );

        emailService.enviarEmail(devEmail, assunto, corpo);
        return ResponseEntity.ok().build();
    }
}