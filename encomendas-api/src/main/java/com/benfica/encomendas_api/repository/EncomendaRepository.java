package com.benfica.encomendas_api.repository;

import com.benfica.encomendas_api.model.Encomenda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EncomendaRepository extends JpaRepository<Encomenda, UUID> {

    // Busca encomendas e já carrega os itens e o cliente (para evitar N+1 queries)
    // @Query("SELECT e FROM Encomenda e JOIN FETCH e.itens JOIN FETCH e.cliente WHERE e.equipe.id = :equipeId ORDER BY e.dataCriacao DESC")
    List<Encomenda> findByEquipeId(UUID equipeId);
}