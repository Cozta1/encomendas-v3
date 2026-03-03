package com.benfica.encomendas_api.security;

import com.benfica.encomendas_api.model.Usuario;
import com.benfica.encomendas_api.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.security.Principal;

@Component
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");
            if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
                String jwt = authHeader.substring(7);
                if (tokenProvider.validateToken(jwt)) {
                    String email = tokenProvider.getUsernameFromJWT(jwt);
                    Usuario usuario = usuarioRepository.findByEmail(email).orElse(null);
                    if (usuario != null) {
                        // Principal must return userId as string for convertAndSendToUser
                        final Long userId = usuario.getId();
                        Principal principal = () -> userId.toString();
                        accessor.setUser(principal);
                    }
                }
            }
        }

        return message;
    }
}
