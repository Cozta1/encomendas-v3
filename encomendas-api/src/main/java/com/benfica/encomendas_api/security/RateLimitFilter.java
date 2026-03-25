package com.benfica.encomendas_api.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate limiting filter for sensitive auth endpoints.
 * Uses Bucket4j token-bucket algorithm per client IP to prevent brute-force
 * and credential-stuffing attacks (OWASP A07:2021 — Identification and Authentication Failures).
 *
 * Limits (per IP):
 *  POST /api/auth/login           → 5 attempts / 1 minute
 *  POST /api/auth/forgot-password → 3 attempts / 15 minutes
 *  POST /api/auth/register        → 10 attempts / 1 hour
 *  POST /api/auth/reset-password  → 5 attempts / 15 minutes
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    // Keyed as "endpointKey:clientIp" → Bucket
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String path = request.getServletPath();
        String endpointKey = resolveEndpointKey(path);

        if (endpointKey == null) {
            // Not a rate-limited endpoint — pass through
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = extractClientIp(request);
        String bucketKey = endpointKey + ":" + clientIp;

        Bucket bucket = buckets.computeIfAbsent(bucketKey, k -> createBucket(endpointKey));

        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            // OWASP: return 429 with Retry-After; avoid leaking information about account existence
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setHeader("Retry-After", "60");
            response.getWriter().write("{\"error\":\"Muitas tentativas. Tente novamente mais tarde.\"}");
        }
    }

    /**
     * Maps a request path to a rate-limit key.
     * Only POST requests to auth endpoints are limited; returns null otherwise.
     */
    private String resolveEndpointKey(String path) {
        if (path.equals("/api/auth/login"))            return "login";
        if (path.equals("/api/auth/forgot-password"))  return "forgot-password";
        if (path.equals("/api/auth/register"))         return "register";
        if (path.equals("/api/auth/reset-password"))   return "reset-password";
        return null;
    }

    /**
     * Creates a Bucket4j bucket with limits tuned for the given endpoint key.
     */
    private Bucket createBucket(String endpointKey) {
        Bandwidth limit = switch (endpointKey) {
            // 5 tokens refilled every minute — max 5 login attempts/min per IP
            case "login"            -> Bandwidth.classic(5,  Refill.intervally(5,  Duration.ofMinutes(1)));
            // 3 tokens refilled every 15 min — prevents email enumeration via timing
            case "forgot-password"  -> Bandwidth.classic(3,  Refill.intervally(3,  Duration.ofMinutes(15)));
            // 10 tokens refilled every hour — prevents mass account creation
            case "register"         -> Bandwidth.classic(10, Refill.intervally(10, Duration.ofHours(1)));
            // 5 tokens refilled every 15 min — limits token guessing
            case "reset-password"   -> Bandwidth.classic(5,  Refill.intervally(5,  Duration.ofMinutes(15)));
            // Safe default
            default                 -> Bandwidth.classic(10, Refill.intervally(10, Duration.ofMinutes(1)));
        };
        return Bucket.builder().addLimit(limit).build();
    }

    /**
     * Extracts the real client IP, accounting for load balancers/reverse proxies (AWS App Runner).
     * Takes the leftmost IP from X-Forwarded-For which represents the original client.
     */
    private String extractClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            // X-Forwarded-For: client, proxy1, proxy2 — take leftmost (original client)
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
