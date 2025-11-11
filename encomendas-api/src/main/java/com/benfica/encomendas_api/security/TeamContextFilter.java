package com.benfica.encomendas_api.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
public class TeamContextFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(TeamContextFilter.class);
    private static final String TEAM_HEADER = "X-Team-ID";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        try {
            String teamIdHeader = request.getHeader(TEAM_HEADER);

            if (StringUtils.hasText(teamIdHeader)) {
                try {
                    UUID teamId = UUID.fromString(teamIdHeader);
                    TeamContextHolder.setTeamId(teamId);
                    logger.debug("Contexto de equipe definido para: {}", teamId);
                } catch (IllegalArgumentException e) {
                    logger.warn("Recebido X-Team-ID inválido (não é UUID): {}", teamIdHeader);
                    // Decide-se por não setar o contexto e continuar a requisição
                }
            } else {
                // Se o header não estiver presente, apenas limpamos (embora o 'finally' já faça isso)
                TeamContextHolder.clear();
            }

            // Continua a cadeia de filtros
            filterChain.doFilter(request, response);

        } finally {
            // CRUCIAL: Limpa o ThreadLocal após a requisição
            // para evitar vazamento de dados entre requisições no pool de threads
            TeamContextHolder.clear();
        }
    }
}