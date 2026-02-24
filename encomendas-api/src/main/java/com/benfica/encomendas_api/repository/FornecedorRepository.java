package com.benfica.encomendas_api.repository;

import com.benfica.encomendas_api.model.Fornecedor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional; // <-- IMPORTAR
import java.util.UUID;

@Repository
public interface FornecedorRepository extends JpaRepository<Fornecedor, UUID> {

    List<Fornecedor> findByEquipeId(UUID equipeId);
    List<Fornecedor> findByEquipeIdAndNomeContainingIgnoreCase(UUID equipeId, String nome);

    Optional<Fornecedor> findByIdAndEquipeId(UUID id, UUID equipeId);

    Optional<Fornecedor> findByEquipeIdAndNomeIgnoreCase(UUID equipeId, String nome);

    Optional<Fornecedor> findByEquipeIdAndEmailIgnoreCase(UUID equipeId, String email);
}