package com.benfica.encomendas_api.repository;

import com.benfica.encomendas_api.model.ChecklistCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public interface ChecklistCardRepository extends JpaRepository<ChecklistCard, UUID> {

    @Query("SELECT c FROM ChecklistCard c JOIN FETCH c.board b JOIN FETCH b.equipe WHERE c.horarioFechamento BETWEEN :inicio AND :fim")
    List<ChecklistCard> findCardsRecentlyClosedBetween(@Param("inicio") LocalTime inicio, @Param("fim") LocalTime fim);
}