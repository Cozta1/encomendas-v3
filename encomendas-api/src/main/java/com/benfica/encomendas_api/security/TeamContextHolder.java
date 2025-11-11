package com.benfica.encomendas_api.security;

import java.util.UUID;

/**
 * Armazena o ID da equipe ativa para a thread da requisição atual.
 * Isso funciona de forma similar ao SecurityContextHolder.
 */
public class TeamContextHolder {

    // ThreadLocal garante que cada thread (requisição) tenha sua própria cópia
    private static final ThreadLocal<UUID> teamIdContext = new ThreadLocal<>();

    public static void setTeamId(UUID teamId) {
        if (teamId == null) {
            teamIdContext.remove();
        } else {
            teamIdContext.set(teamId);
        }
    }

    public static UUID getTeamId() {
        return teamIdContext.get();
    }

    public static void clear() {
        teamIdContext.remove();
    }
}