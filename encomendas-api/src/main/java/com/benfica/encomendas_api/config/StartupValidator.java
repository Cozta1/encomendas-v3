package com.benfica.encomendas_api.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class StartupValidator {

    private static final Logger logger = LoggerFactory.getLogger(StartupValidator.class);

    @Value("${app.jwtSecret:}")
    private String jwtSecret;

    @Value("${app.registrationKey:}")
    private String registrationKey;

    @Value("${app.adminRegistrationKey:}")
    private String adminRegistrationKey;

    @PostConstruct
    public void validate() {
        if (jwtSecret == null || jwtSecret.isBlank()) {
            throw new IllegalStateException(
                    "APP_JWT_SECRET não está definido. Configure a variável de ambiente antes de iniciar a aplicação.");
        }
        if (jwtSecret.length() < 32) {
            logger.warn("APP_JWT_SECRET é muito curto ({}). Recomendado: mínimo 64 caracteres.", jwtSecret.length());
        }
        if (registrationKey == null || registrationKey.isBlank()) {
            throw new IllegalStateException(
                    "APP_REGISTRATION_KEY não está definido. Configure a variável de ambiente.");
        }
        if (adminRegistrationKey == null || adminRegistrationKey.isBlank()) {
            throw new IllegalStateException(
                    "APP_ADMIN_REGISTRATION_KEY não está definido. Configure a variável de ambiente.");
        }
        logger.info("Validação de configuração de segurança concluída com sucesso.");
    }
}
