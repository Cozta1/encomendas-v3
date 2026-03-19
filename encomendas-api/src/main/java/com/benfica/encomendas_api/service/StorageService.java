package com.benfica.encomendas_api.service;

import java.io.IOException;
import java.io.InputStream;

/**
 * Abstração de armazenamento de ficheiros.
 * Implementações: LocalStorageService (disco local) e S3StorageService (AWS S3).
 */
public interface StorageService {

    /**
     * Armazena um ficheiro e retorna a URL de acesso.
     *
     * @param subdir       subdiretório (ex: "chat")
     * @param filename     nome do ficheiro (já com UUID)
     * @param inputStream  conteúdo do ficheiro
     * @param contentLength tamanho em bytes
     * @param contentType  MIME type
     * @return URL pública ou relativa para acessar o ficheiro
     */
    String store(String subdir, String filename, InputStream inputStream,
                 long contentLength, String contentType) throws IOException;
}
