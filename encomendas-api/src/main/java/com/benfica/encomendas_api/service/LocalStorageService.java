package com.benfica.encomendas_api.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

/**
 * Armazenamento local em disco.
 * Ativo quando o perfil "aws" NÃO está ativo (desenvolvimento, Docker Compose local).
 */
@Service
@Profile("!aws")
public class LocalStorageService implements StorageService {

    private static final Logger logger = LoggerFactory.getLogger(LocalStorageService.class);

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Override
    public String store(String subdir, String filename, InputStream inputStream,
                        long contentLength, String contentType) throws IOException {
        Path uploadPath = Paths.get(uploadDir, subdir);
        Files.createDirectories(uploadPath);

        Path filePath = uploadPath.resolve(filename);
        Files.copy(inputStream, filePath, StandardCopyOption.REPLACE_EXISTING);

        logger.info("Ficheiro guardado localmente: {}", filePath);

        return "/uploads/" + subdir + "/" + filename;
    }
}
