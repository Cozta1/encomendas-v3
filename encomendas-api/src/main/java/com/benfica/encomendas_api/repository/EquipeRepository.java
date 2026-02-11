package com.benfica.encomendas_api.repository;

import com.benfica.encomendas_api.model.Equipe;
import com.benfica.encomendas_api.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional; // Importante adicionar este import
import java.util.UUID;

@Repository
public interface EquipeRepository extends JpaRepository<Equipe, UUID> {

    // Método necessário para o DataSeeder encontrar a equipa pelo nome
    Optional<Equipe> findByNome(String nome);

    // Busca equipas onde o utilizador é Admin (método antigo)
    List<Equipe> findByAdministrador(Usuario usuario);

    // Busca equipas onde o utilizador é Admin OU está na lista de Membros
    List<Equipe> findByAdministradorOrMembrosContaining(Usuario admin, Usuario membro);
}