package com.benfica.encomendas_api.repository;

import com.benfica.encomendas_api.model.ChecklistBoard;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ChecklistBoardRepository extends JpaRepository<ChecklistBoard, UUID> {
    List<ChecklistBoard> findByEquipeId(UUID equipeId);
}