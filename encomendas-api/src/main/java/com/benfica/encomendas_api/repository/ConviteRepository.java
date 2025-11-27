package com.benfica.encomendas_api.repository;

import com.benfica.encomendas_api.model.Convite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ConviteRepository extends JpaRepository<Convite, UUID> {
    List<Convite> findByEquipeId(UUID equipeId);
    List<Convite> findByEmailDestinoAndStatus(String email, String status);
}