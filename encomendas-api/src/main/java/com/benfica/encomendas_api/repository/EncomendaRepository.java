package com.benfica.encomendas_api.repository;

import com.benfica.encomendas_api.model.Encomenda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query; // <-- IMPORTAR
import org.springframework.data.repository.query.Param; // <-- IMPORTAR
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EncomendaRepository extends JpaRepository<Encomenda, UUID> {

    // --- MÉTODO ATUALIZADO ---
    /**
     * Busca encomendas da equipe, já carregando (JOIN FETCH) as relações
     * para evitar N+1 queries e erros de LazyInitialization ou NullPointer.
     */
    @Query("SELECT e FROM Encomenda e " +
            "LEFT JOIN FETCH e.cliente c " +
            "LEFT JOIN FETCH e.itens i " +
            "LEFT JOIN FETCH i.produto p " +
            "LEFT JOIN FETCH i.fornecedor f " +
            "WHERE e.equipe.id = :equipeId " +
            // Adiciona "DISTINCT" para evitar duplicatas causadas pelos joins
            "GROUP BY e.id, c.id " +
            "ORDER BY e.dataCriacao DESC")
    List<Encomenda> findByEquipeId(@Param("equipeId") UUID equipeId);
}