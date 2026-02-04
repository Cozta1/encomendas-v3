package com.benfica.encomendas_api.repository;

import com.benfica.encomendas_api.model.ChecklistBoard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ChecklistBoardRepository extends JpaRepository<ChecklistBoard, UUID> {

    // Método existente para o funcionário (filtrado)
    @Query("SELECT b FROM ChecklistBoard b WHERE b.equipe.id = :equipeId AND (b.usuarioEspecifico IS NULL OR b.usuarioEspecifico.id = :usuarioId)")
    List<ChecklistBoard> findByEquipeAndUsuario(@Param("equipeId") UUID equipeId, @Param("usuarioId") Long usuarioId);

    // --- NOVO: Método para o Admin (Traz tudo da equipe) ---
    List<ChecklistBoard> findByEquipeId(UUID equipeId);
}