package com.benfica.encomendas_api.repository;

import com.benfica.encomendas_api.model.Fornecedor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FornecedorRepository extends JpaRepository<Fornecedor, UUID> {

    /**
     * Encontra todos os fornecedores associados a um ID de equipe específico.
     */
    List<Fornecedor> findByEquipeId(UUID equipeId);
}