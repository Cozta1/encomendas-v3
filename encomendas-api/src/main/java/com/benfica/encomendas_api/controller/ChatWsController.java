package com.benfica.encomendas_api.controller;

import com.benfica.encomendas_api.dto.EnviarMensagemRequest;
import com.benfica.encomendas_api.dto.MensagemChatDTO;
import com.benfica.encomendas_api.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.UUID;

@Controller
public class ChatWsController {

    @Autowired
    private ChatService chatService;

    @MessageMapping("/chat.send")
    public void enviarMensagem(@Payload EnviarMensagemRequest req, Principal principal) {
        Long userId = Long.parseLong(principal.getName());
        chatService.enviarMensagem(req, userId);
    }

    @MessageMapping("/chat.lida")
    public void marcarLida(@Payload String conversaIdStr, Principal principal) {
        Long userId = Long.parseLong(principal.getName());
        UUID conversaId = UUID.fromString(conversaIdStr);
        chatService.marcarLida(conversaId, userId);
    }
}
