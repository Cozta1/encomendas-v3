package com.benfica.encomendas_api.repository;

import com.benfica.encomendas_api.model.Equipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface EquipeRepository extends JpaRepository<Equipe, UUID> {
}