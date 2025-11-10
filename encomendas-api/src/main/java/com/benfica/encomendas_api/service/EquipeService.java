package com.benfica.encomendas_api.service;

import com.benfica.encomendas_api.dto.EquipeDTO;
import com.benfica.encomendas_api.model.Equipe;
import com.benfica.encomendas_api.repository.EquipeRepository;
import com.benfica.encomendas_api.model.Usuario;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class EquipeService {

    @Autowired
    private EquipeRepository equipeRepository;

    public List<Equipe> listarTodas() {
        return equipeRepository.findAll();
    }

    @Transactional
    public Equipe criarEquipe(EquipeDTO dto, Usuario admin) {
        Equipe novaEquipe = Equipe.builder()
                .nome(dto.getNome())
                .descricao(dto.getDescricao())
                .administrador(admin)
                .ativa(true) // Já é padrão no model, mas reforçando
                .build();

        return equipeRepository.save(novaEquipe);
    }
}