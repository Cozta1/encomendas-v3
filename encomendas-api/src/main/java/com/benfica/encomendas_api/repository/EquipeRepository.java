package com.benfica.encomendas_api.repository;

import com.benfica.encomendas_api.model.Equipe;
import com.benfica.encomendas_api.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EquipeRepository extends JpaRepository<Equipe, UUID> {

    // Método antigo (pode manter ou remover se não usar mais diretamente)
    List<Equipe> findByAdministrador(Usuario usuario);

    // --- NOVO MÉTODO ---
    // Busca equipas onde o utilizador é Admin OU está na lista de Membros
    List<Equipe> findByAdministradorOrMembrosContaining(Usuario admin, Usuario membro);
}