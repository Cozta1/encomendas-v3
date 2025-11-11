package com.benfica.encomendas_api.repository;

import com.benfica.encomendas_api.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, UUID> {

    /**
     * Encontra todos os clientes associados a um ID de equipe específico.
     * @param equipeId O UUID da equipe.
     * @return Lista de clientes daquela equipe.
     */
    List<Cliente> findByEquipeId(UUID equipeId);
}