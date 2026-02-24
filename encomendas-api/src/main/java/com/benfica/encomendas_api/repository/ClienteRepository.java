package com.benfica.encomendas_api.repository;

import com.benfica.encomendas_api.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ClienteRepository extends JpaRepository<Cliente, UUID> {

    List<Cliente> findByEquipeId(UUID equipeId);

    List<Cliente> findByEquipeIdAndNomeContainingIgnoreCase(UUID equipeId, String nome);

    Optional<Cliente> findByEquipeIdAndCodigoInterno(UUID equipeId, String codigoInterno);

    Optional<Cliente> findByEquipeIdAndCpf(UUID equipeId, String cpf);

    Optional<Cliente> findByEquipeIdAndEmailIgnoreCase(UUID equipeId, String email);
}