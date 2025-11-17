package com.benfica.encomendas_api.repository;

import com.benfica.encomendas_api.model.Produto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional; // <-- IMPORTAR
import java.util.UUID;

@Repository
public interface ProdutoRepository extends JpaRepository<Produto, UUID> {

    List<Produto> findByEquipeId(UUID equipeId);
    List<Produto> findByEquipeIdAndNomeContainingIgnoreCase(UUID equipeId, String nome);

    // --- NOVO MÉTODO ADICIONADO ---
    Optional<Produto> findByIdAndEquipeId(UUID id, UUID equipeId);
}