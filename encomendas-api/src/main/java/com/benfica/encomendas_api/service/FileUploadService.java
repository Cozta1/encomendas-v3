package com.benfica.encomendas_api.service;

import com.benfica.encomendas_api.dto.MensagemAnexoDTO;
import com.benfica.encomendas_api.model.TipoAnexo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Set;
import java.util.UUID;

@Service
public class FileUploadService {

    private static final Logger logger = LoggerFactory.getLogger(FileUploadService.class);

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "jpg", "jpeg", "png", "gif", "webp", "pdf", "doc", "docx", "xls", "xlsx", "txt"
    );

    private final StorageService storageService;

    public FileUploadService(StorageService storageService) {
        this.storageService = storageService;
    }

    public MensagemAnexoDTO uploadChatFile(MultipartFile file) throws IOException {
        validateFile(file);

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
        String nomeArquivo = UUID.randomUUID() + "_" + originalFilename;

        String url = storageService.store(
                "chat",
                nomeArquivo,
                file.getInputStream(),
                file.getSize(),
                file.getContentType()
        );

        TipoAnexo tipoAnexo = detectTipoAnexo(file.getContentType());

        return MensagemAnexoDTO.builder()
                .nomeArquivo(originalFilename)
                .tipoArquivo(tipoAnexo.name())
                .url(url)
                .build();
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Ficheiro está vazio.");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new IllegalArgumentException("Nome do ficheiro inválido.");
        }

        originalFilename = StringUtils.cleanPath(originalFilename);

        if (originalFilename.contains("..")) {
            throw new IllegalArgumentException("Nome do ficheiro contém caracteres inválidos.");
        }

        String ext = "";
        int dotIdx = originalFilename.lastIndexOf('.');
        if (dotIdx > 0) {
            ext = originalFilename.substring(dotIdx + 1).toLowerCase();
        }
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw new IllegalArgumentException("Tipo de ficheiro não permitido: " + ext);
        }
    }

    private TipoAnexo detectTipoAnexo(String contentType) {
        if (contentType == null) return TipoAnexo.DOC;
        if (contentType.startsWith("image/")) return TipoAnexo.IMG;
        if (contentType.equals("application/pdf")) return TipoAnexo.PDF;
        return TipoAnexo.DOC;
    }
}
