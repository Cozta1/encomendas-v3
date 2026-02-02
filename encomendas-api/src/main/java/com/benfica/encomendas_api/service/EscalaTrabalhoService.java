package com.benfica.encomendas_api.service;

import com.benfica.encomendas_api.dto.EscalaTrabalhoDTO;
import com.benfica.encomendas_api.model.EscalaTrabalho;
import com.benfica.encomendas_api.model.Usuario;
import com.benfica.encomendas_api.repository.EscalaTrabalhoRepository;
import com.benfica.encomendas_api.repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class EscalaTrabalhoService {

    @Autowired
    private EscalaTrabalhoRepository escalaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    // --- FUNCIONALIDADE 1: ADM define a escala ---
    @Transactional
    public EscalaTrabalhoDTO salvarEscala(EscalaTrabalhoDTO dto) {
        Usuario usuario = usuarioRepository.findById(dto.getUsuarioId())
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));

        // Verifica se já existe escala para este dia (atualização ou criação)
        EscalaTrabalho escala = escalaRepository.findByUsuarioIdAndData(dto.getUsuarioId(), dto.getData());

        if (escala == null) {
            escala = new EscalaTrabalho();
            escala.setUsuario(usuario);
            escala.setData(dto.getData());
        }

        escala.setHorarioInicio(dto.getHorarioInicio());
        escala.setHorarioFim(dto.getHorarioFim());
        escala.setTipo(dto.getTipo());
        escala.setObservacao(dto.getObservacao());

        EscalaTrabalho salva = escalaRepository.save(escala);
        return mapToDTO(salva);
    }

    // --- FUNCIONALIDADE 2: Listar escala (para o Calendário) ---
    public List<EscalaTrabalhoDTO> buscarEscalaPorPeriodo(Long usuarioId, LocalDate inicio, LocalDate fim) {
        List<EscalaTrabalho> escalas = escalaRepository.findByUsuarioIdAndDataBetween(usuarioId, inicio, fim);
        return escalas.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    // --- Helper de Mapeamento ---
    private EscalaTrabalhoDTO mapToDTO(EscalaTrabalho entity) {
        return EscalaTrabalhoDTO.builder()
                .id(entity.getId())
                .usuarioId(entity.getUsuario().getId())
                .nomeUsuario(entity.getUsuario().getNomeCompleto())
                .data(entity.getData())
                .horarioInicio(entity.getHorarioInicio())
                .horarioFim(entity.getHorarioFim())
                .tipo(entity.getTipo())
                .observacao(entity.getObservacao())
                .build();
    }
}