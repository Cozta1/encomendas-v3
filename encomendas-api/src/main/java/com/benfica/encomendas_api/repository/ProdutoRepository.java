package com.benfica.encomendas_api.repository;

import com.benfica.encomendas_api.model.Produto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProdutoRepository extends JpaRepository<Produto, UUID> {

    /**
     * Encontra todos os produtos associados a um ID de equipe específico.
     */
    List<Produto> findByEquipeId(UUID equipeId);
}