package com.benfica.encomendas_api.repository;

import com.benfica.encomendas_api.model.ChecklistCard;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ChecklistCardRepository extends JpaRepository<ChecklistCard, UUID> {
}