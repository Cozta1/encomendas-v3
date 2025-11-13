package com.benfica.encomendas_api.repository;

import com.benfica.encomendas_api.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional; // <-- IMPORTAR
import java.util.UUID;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, UUID> {

    List<Cliente> findByEquipeId(UUID equipeId);

    // --- NOVO MÉTODO ADICIONADO ---
    Optional<Cliente> findByIdAndEquipeId(UUID id, UUID equipeId);
}