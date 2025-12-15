package com.benfica.encomendas_api.repository;

import com.benfica.encomendas_api.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ClienteRepository extends JpaRepository<Cliente, UUID> {

    List<Cliente> findByEquipeId(UUID equipeId);

    // --- NOVO MÉTODO PARA BUSCA ---
    // Busca clientes da equipe que contenham o nome (case insensitive)
    List<Cliente> findByEquipeIdAndNomeContainingIgnoreCase(UUID equipeId, String nome);
}