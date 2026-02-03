package com.benfica.encomendas_api.repository;

import com.benfica.encomendas_api.model.ChecklistBoard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ChecklistBoardRepository extends JpaRepository<ChecklistBoard, UUID> {

    // Busca boards da equipe que:
    // 1. Não têm usuário específico (Gerais)
    // 2. OU têm o ID do usuário solicitante (Individuais)
    @Query("SELECT b FROM ChecklistBoard b WHERE b.equipe.id = :equipeId AND (b.usuarioEspecifico IS NULL OR b.usuarioEspecifico.id = :usuarioId)")
    List<ChecklistBoard> findByEquipeAndUsuario(@Param("equipeId") UUID equipeId, @Param("usuarioId") Long usuarioId);
}