package com.benfica.encomendas_api.repository;

import com.benfica.encomendas_api.model.LeituraMensagem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface LeituraMensagemRepository extends JpaRepository<LeituraMensagem, UUID> {

    Optional<LeituraMensagem> findByConversaIdAndUsuarioId(UUID conversaId, Long usuarioId);
}
