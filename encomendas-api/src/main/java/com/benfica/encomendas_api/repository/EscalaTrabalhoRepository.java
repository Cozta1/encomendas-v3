package com.benfica.encomendas_api.repository;

import com.benfica.encomendas_api.model.EscalaTrabalho;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface EscalaTrabalhoRepository extends JpaRepository<EscalaTrabalho, Long> {

    // Busca escalas de um usuário em um período específico (ex: mês atual)
    List<EscalaTrabalho> findByUsuarioIdAndDataBetween(Long usuarioId, LocalDate inicio, LocalDate fim);

    // Busca escala de um dia específico para validações
    EscalaTrabalho findByUsuarioIdAndData(Long usuarioId, LocalDate data);

    // Para o ADM ver a escala de todos da equipe (faremos o filtro de equipe na Service/Controller)
    // Mas podemos buscar todos por período para otimizar
    @Query("SELECT e FROM EscalaTrabalho e WHERE e.data BETWEEN :inicio AND :fim")
    List<EscalaTrabalho> findAllByDataBetween(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);
}