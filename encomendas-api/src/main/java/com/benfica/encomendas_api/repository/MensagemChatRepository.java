package com.benfica.encomendas_api.repository;

import com.benfica.encomendas_api.model.MensagemChat;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface MensagemChatRepository extends JpaRepository<MensagemChat, UUID> {

    Page<MensagemChat> findByConversaIdAndDeletadaFalseOrderByEnviadoEmDesc(UUID conversaId, Pageable pageable);

    @Query("""
        SELECT COUNT(m) FROM MensagemChat m
        JOIN m.conversa c
        LEFT JOIN LeituraMensagem l ON l.conversa.id = c.id AND l.usuario.id = :userId
        WHERE c.equipe.id = :equipeId
        AND m.deletada = false
        AND (
            c.tipo = com.benfica.encomendas_api.model.TipoConversa.GRUPO
            OR (c.participanteA IS NOT NULL AND c.participanteA.id = :userId)
            OR (c.participanteB IS NOT NULL AND c.participanteB.id = :userId)
        )
        AND (l.ultimoVistoEm IS NULL OR m.enviadoEm > l.ultimoVistoEm)
        AND m.remetente.id <> :userId
    """)
    long countTotalUnread(@Param("equipeId") UUID equipeId, @Param("userId") Long userId);

    @Query("""
        SELECT COUNT(m) FROM MensagemChat m
        WHERE m.conversa.id = :conversaId
        AND m.deletada = false
        AND m.enviadoEm > :depois
        AND m.remetente.id <> :userId
    """)
    long countUnreadInConversa(@Param("conversaId") UUID conversaId,
                                @Param("depois") LocalDateTime depois,
                                @Param("userId") Long userId);

    @Query("""
        SELECT MAX(m.enviadoEm) FROM MensagemChat m
        WHERE m.conversa.id = :conversaId AND m.deletada = false
    """)
    java.time.LocalDateTime findUltimaMensagemEm(@Param("conversaId") UUID conversaId);

    @Query("""
        SELECT m.conteudo FROM MensagemChat m
        WHERE m.conversa.id = :conversaId AND m.deletada = false
        ORDER BY m.enviadoEm DESC
    """)
    List<String> findUltimasMensagensConteudo(@Param("conversaId") UUID conversaId,
                                               org.springframework.data.domain.Pageable pageable);
}
