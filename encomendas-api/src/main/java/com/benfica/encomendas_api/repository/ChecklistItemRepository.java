package com.benfica.encomendas_api.repository;

import com.benfica.encomendas_api.model.ChecklistItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ChecklistItemRepository extends JpaRepository<ChecklistItem, UUID> {
}