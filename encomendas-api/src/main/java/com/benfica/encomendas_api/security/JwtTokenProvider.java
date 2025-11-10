package com.benfica.encomendas_api.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private static final Logger logger = LoggerFactory.getLogger(JwtTokenProvider.class);

    // Valor padrão super seguro e longo apenas para evitar erros de inicialização se a property faltar.
    // EM PRODUÇÃO, DEFINA ISSO NO application.properties OU VARIÁVEIS DE AMBIENTE!
    @Value("${app.jwtSecret:9a4f2c8d3b7a1e6f4c5d8e9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c}")
    private String jwtSecret;

    @Value("${app.jwtExpirationInMs:86400000}") // Padrão de 1 dia (24 * 60 * 60 * 1000)
    private int jwtExpirationInMs;

    /**
     * Retorna a chave criptográfica usada para assinar os tokens.
     * Se a sua chave for Base64, use Decoders.BASE64.decode(jwtSecret).
     * Para este exemplo, estamos usando os bytes brutos da string UTF-8.
     */
    private SecretKey getKey() {
        // Opção 1: Se sua chave no properties for uma String simples (deve ser longa!)
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));

        // Opção 2 (Recomendado para produção): Se sua chave no properties for codificada em Base64
        // return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
    }

    /**
     * Gera um token JWT para um usuário autenticado.
     */
    public String generateToken(Authentication authentication) {
        UserDetails userPrincipal = (UserDetails) authentication.getPrincipal();

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationInMs);

        return Jwts.builder()
                .subject(userPrincipal.getUsername())
                .issuedAt(new Date())
                .expiration(expiryDate)
                .signWith(getKey()) // JJWT 0.12.x determina o algoritmo automaticamente com base na força da chave
                .compact();
    }

    /**
     * Extrai o username (email) do token JWT.
     */
    public String getUsernameFromJWT(String token) {
        return Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    /**
     * Valida se o token é autêntico e não expirou.
     */
    public boolean validateToken(String authToken) {
        try {
            Jwts.parser()
                    .verifyWith(getKey())
                    .build()
                    .parse(authToken); // O parse lançará exceções se o token for inválido
            return true;
        } catch (SignatureException ex) {
            logger.error("Assinatura JWT inválida");
        } catch (MalformedJwtException ex) {
            logger.error("Token JWT inválido");
        } catch (ExpiredJwtException ex) {
            logger.error("Token JWT expirado");
        } catch (UnsupportedJwtException ex) {
            logger.error("Token JWT não suportado");
        } catch (IllegalArgumentException ex) {
            logger.error("String claims JWT está vazia");
        }
        return false;
    }
}