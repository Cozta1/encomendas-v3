package com.benfica.encomendas_api.service;

import com.benfica.encomendas_api.dto.EquipeDTO;
import com.benfica.encomendas_api.dto.EquipeResponseDTO; // <-- IMPORTAR O NOVO DTO
import com.benfica.encomendas_api.model.Equipe;
import com.benfica.encomendas_api.repository.EquipeRepository;
import com.benfica.encomendas_api.model.Usuario;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors; // <-- IMPORTAR STREAMS

@Service
public class EquipeService {

    @Autowired
    private EquipeRepository equipeRepository;

    // MODIFICADO: Agora retorna o DTO
    @Transactional(readOnly = true)
    public List<EquipeResponseDTO> listarEquipesDoUsuario(Usuario usuario) {
        List<Equipe> equipes = equipeRepository.findByAdministrador(usuario);

        // Mapeia a lista de Entidade (Equipe) para uma lista de DTO (EquipeResponseDTO)
        return equipes.stream()
                .map(equipe -> EquipeResponseDTO.builder()
                        .id(equipe.getId())
                        .nome(equipe.getNome())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public Equipe criarEquipe(EquipeDTO dto, Usuario admin) {
        Equipe novaEquipe = Equipe.builder()
                .nome(dto.getNome())
                .descricao(dto.getDescricao())
                .administrador(admin)
                .ativa(true)
                .build();

        return equipeRepository.save(novaEquipe);
    }
}