package com.benfica.encomendas_api.repository;

import com.benfica.encomendas_api.model.Equipe;
import com.benfica.encomendas_api.model.Usuario; // <-- Importar Usuario
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List; // <-- Importar List
import java.util.UUID;

@Repository
public interface EquipeRepository extends JpaRepository<Equipe, UUID> {

    /**
     * Busca todas as equipes onde o usuário fornecido é o administrador.
     * O Spring Data JPA cria a query automaticamente baseado no nome do método.
     */
    List<Equipe> findByAdministrador(Usuario usuario);
}