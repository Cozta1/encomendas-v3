package com.benfica.encomendas_api.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class SupabaseBroadcastService {

    private static final Logger logger = LoggerFactory.getLogger(SupabaseBroadcastService.class);

    @Value("${supabase.url:}")
    private String supabaseUrl;

    @Value("${supabase.service-role-key:}")
    private String serviceRoleKey;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Envia um broadcast Supabase Realtime para o canal especificado.
     * O prefixo "realtime:" é adicionado automaticamente para corresponder
     * ao canal subscrito pelo cliente (supabase.channel('chat:id')).
     */
    public void broadcast(String channel, String event, Object payload) {
        if (supabaseUrl.isBlank() || serviceRoleKey.isBlank()) {
            logger.debug("Supabase não configurado — broadcast ignorado para canal: {}", channel);
            return;
        }
        try {
            String url = supabaseUrl + "/realtime/v1/api/broadcast";

            Map<String, Object> message = Map.of(
                "topic", "realtime:" + channel,
                "event", event,
                "payload", payload
            );
            Map<String, Object> body = Map.of("messages", List.of(message));

            HttpHeaders headers = new HttpHeaders();
            headers.set("apikey", serviceRoleKey);
            headers.set("Authorization", "Bearer " + serviceRoleKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            restTemplate.postForEntity(url, new HttpEntity<>(body, headers), Void.class);
        } catch (Exception e) {
            logger.warn("Falha ao enviar broadcast Supabase [{}]: {}", channel, e.getMessage());
        }
    }
}
