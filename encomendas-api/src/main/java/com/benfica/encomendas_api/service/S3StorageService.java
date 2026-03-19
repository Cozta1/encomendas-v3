package com.benfica.encomendas_api.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

import java.io.IOException;
import java.io.InputStream;

/**
 * Armazenamento no AWS S3.
 * Ativo apenas com o perfil "aws" (SPRING_PROFILES_ACTIVE=aws).
 * Credenciais via IAM Role do App Runner (sem access keys).
 */
@Service
@Profile("aws")
public class S3StorageService implements StorageService {

    private static final Logger logger = LoggerFactory.getLogger(S3StorageService.class);

    private final S3Client s3Client;

    @Value("${app.storage.s3.bucket}")
    private String bucketName;

    @Value("${app.storage.s3.region:us-east-1}")
    private String region;

    public S3StorageService(S3Client s3Client) {
        this.s3Client = s3Client;
    }

    @Override
    public String store(String subdir, String filename, InputStream inputStream,
                        long contentLength, String contentType) throws IOException {
        String key = subdir + "/" + filename;

        try {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(contentType != null ? contentType : "application/octet-stream")
                    .build();

            s3Client.putObject(request, RequestBody.fromInputStream(inputStream, contentLength));

            logger.info("Ficheiro guardado no S3: s3://{}/{}", bucketName, key);

            return String.format("https://%s.s3.%s.amazonaws.com/%s", bucketName, region, key);
        } catch (S3Exception e) {
            throw new IOException("Erro ao guardar ficheiro no S3: " + e.getMessage(), e);
        }
    }
}
