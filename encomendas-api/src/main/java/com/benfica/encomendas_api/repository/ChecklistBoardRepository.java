package com.benfica.encomendas_api.repository;

import com.benfica.encomendas_api.model.ChecklistBoard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ChecklistBoardRepository extends JpaRepository<ChecklistBoard, UUID> {

    // Método para o funcionário (filtrado) — JOIN FETCH evita N+1 boards->cards
    // @BatchSize nos cards/itens/anexos das entidades complementa com batch IN-queries
    @Query("SELECT DISTINCT b FROM ChecklistBoard b " +
           "LEFT JOIN FETCH b.cards " +
           "WHERE b.equipe.id = :equipeId AND (b.usuarioEspecifico IS NULL OR b.usuarioEspecifico.id = :usuarioId)")
    List<ChecklistBoard> findByEquipeAndUsuario(@Param("equipeId") UUID equipeId, @Param("usuarioId") Long usuarioId);

    // Método para o Admin (Traz tudo da equipe) — JOIN FETCH evita N+1 boards->cards
    @Query("SELECT DISTINCT b FROM ChecklistBoard b " +
           "LEFT JOIN FETCH b.cards " +
           "WHERE b.equipe.id = :equipeId")
    List<ChecklistBoard> findByEquipeId(@Param("equipeId") UUID equipeId);
}