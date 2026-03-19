package com.benfica.encomendas_api.controller;

import com.benfica.encomendas_api.dto.EnviarMensagemRequest;
import com.benfica.encomendas_api.service.ChatService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.UUID;

@Controller
public class ChatWsController {

    private static final Logger logger = LoggerFactory.getLogger(ChatWsController.class);

    @Autowired
    private ChatService chatService;

    @MessageMapping("/chat.send")
    public void enviarMensagem(@Payload EnviarMensagemRequest req, Principal principal) {
        if (principal == null) {
            logger.warn("WebSocket /chat.send recebido sem autenticação");
            return;
        }
        try {
            Long userId = Long.parseLong(principal.getName());
            chatService.enviarMensagem(req, userId);
        } catch (NumberFormatException e) {
            logger.error("ID de utilizador inválido no principal: {}", principal.getName());
        }
    }

    @MessageMapping("/chat.lida")
    public void marcarLida(@Payload String conversaIdStr, Principal principal) {
        if (principal == null) {
            logger.warn("WebSocket /chat.lida recebido sem autenticação");
            return;
        }
        try {
            Long userId = Long.parseLong(principal.getName());
            UUID conversaId = UUID.fromString(conversaIdStr);
            chatService.marcarLida(conversaId, userId);
        } catch (IllegalArgumentException e) {
            logger.error("Parâmetros inválidos em /chat.lida: userId={}, conversaId={}", principal.getName(), conversaIdStr);
        }
    }
}
