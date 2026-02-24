package com.benfica.encomendas_api.repository;

import com.benfica.encomendas_api.model.Notificacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface NotificacaoRepository extends JpaRepository<Notificacao, UUID> {

    List<Notificacao> findByDestinatarioIdOrderByDataEnvioDesc(Long destinatarioId);

    long countByDestinatarioIdAndLidaFalse(Long destinatarioId);

    boolean existsByChaveDedup(String chaveDedup);

    @Modifying
    @Query("UPDATE Notificacao n SET n.lida = true WHERE n.destinatario.id = :destinatarioId AND n.lida = false")
    void marcarTodasLidas(@Param("destinatarioId") Long destinatarioId);
}
