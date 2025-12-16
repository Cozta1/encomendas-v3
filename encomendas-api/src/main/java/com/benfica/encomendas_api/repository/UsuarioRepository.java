package com.benfica.encomendas_api.repository;

import com.benfica.encomendas_api.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmail(String email);
    Optional<Usuario> findByIdentificacao(String identificacao);

    // --- NOVO MÉTODO ---
    List<Usuario> findByEquipeId(UUID equipeId);
}