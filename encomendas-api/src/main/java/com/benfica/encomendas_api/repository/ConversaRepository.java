package com.benfica.encomendas_api.repository;

import com.benfica.encomendas_api.model.Conversa;
import com.benfica.encomendas_api.model.TipoConversa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConversaRepository extends JpaRepository<Conversa, UUID> {

    @Query("""
        SELECT c FROM Conversa c
        WHERE c.equipe.id = :equipeId
        AND (
            c.tipo = com.benfica.encomendas_api.model.TipoConversa.GRUPO
            OR (c.participanteA IS NOT NULL AND c.participanteA.id = :userId)
            OR (c.participanteB IS NOT NULL AND c.participanteB.id = :userId)
        )
        ORDER BY c.criadoEm ASC
    """)
    List<Conversa> findAllForUser(@Param("equipeId") UUID equipeId, @Param("userId") Long userId);

    @Query("""
        SELECT c FROM Conversa c
        WHERE c.equipe.id = :equipeId
        AND c.tipo = com.benfica.encomendas_api.model.TipoConversa.PRIVADO
        AND (
            (c.participanteA.id = :userA AND c.participanteB.id = :userB)
            OR (c.participanteA.id = :userB AND c.participanteB.id = :userA)
        )
    """)
    Optional<Conversa> findPrivado(@Param("equipeId") UUID equipeId,
                                    @Param("userA") Long userA,
                                    @Param("userB") Long userB);

    @Query("""
        SELECT c FROM Conversa c
        WHERE c.equipe.id = :equipeId
        AND c.tipo = :tipo
    """)
    Optional<Conversa> findByEquipeIdAndTipo(@Param("equipeId") UUID equipeId, @Param("tipo") TipoConversa tipo);
}
