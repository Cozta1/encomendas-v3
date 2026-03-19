package com.benfica.encomendas_api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

/**
 * Configura o cliente S3 para o perfil AWS.
 * No App Runner, usa IAM Role (credenciais automáticas, sem access keys).
 */
@Configuration
@Profile("aws")
public class S3Config {

    @Value("${app.storage.s3.region:us-east-1}")
    private String region;

    @Bean
    public S3Client s3Client() {
        return S3Client.builder()
                .region(Region.of(region))
                .build();
    }
}
