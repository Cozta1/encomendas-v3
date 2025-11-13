package com.benfica.encomendas_api.repository;

import com.benfica.encomendas_api.model.EncomendaItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface EncomendaItemRepository extends JpaRepository<EncomendaItem, UUID> {
    // Geralmente não precisamos de métodos customizados aqui,
    // pois os itens são acedidos através da Encomenda.
}