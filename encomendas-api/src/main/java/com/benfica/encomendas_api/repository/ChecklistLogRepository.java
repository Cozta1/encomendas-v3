package com.benfica.encomendas_api.repository;

import com.benfica.encomendas_api.model.ChecklistLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface ChecklistLogRepository extends JpaRepository<ChecklistLog, UUID> {

    // Busca todos os logs de um usuário numa data (para reconstruir o estado do checklist dele)
    List<ChecklistLog> findByUsuarioIdAndDataReferencia(Long usuarioId, LocalDate dataReferencia);

    // Busca histórico de um item específico (para auditoria)
    List<ChecklistLog> findByItemIdOrderByDataHoraAcaoDesc(UUID itemId);

    // Para relatórios: buscar logs de uma equipe num dia (query mais complexa, faremos via service ou spec futuramente se precisar)
}