package com.benfica.encomendas_api.service;

import com.benfica.encomendas_api.dto.EscalaReplicacaoDTO; // Import novo
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

    @Transactional
    public EscalaTrabalhoDTO salvarEscala(EscalaTrabalhoDTO dto) {
        Usuario usuario = usuarioRepository.findById(dto.getUsuarioId())
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));

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

    // --- NOVA FUNCIONALIDADE: REPLICAÇÃO ---
    @Transactional
    public void replicarEscala(EscalaReplicacaoDTO dto) {
        Usuario usuario = usuarioRepository.findById(dto.getUsuarioId())
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));

        LocalDate dataAtual = dto.getDataInicio();

        // Loop do dia de início até o dia de fim
        while (!dataAtual.isAfter(dto.getDataFim())) {
            // Verifica se o dia da semana atual está na lista de dias selecionados
            // DayOfWeek value: 1 (Mon) a 7 (Sun)
            if (dto.getDiasSemana().contains(dataAtual.getDayOfWeek().getValue())) {

                // Reaproveita lógica de busca/criação
                EscalaTrabalho escala = escalaRepository.findByUsuarioIdAndData(dto.getUsuarioId(), dataAtual);

                if (escala == null) {
                    escala = new EscalaTrabalho();
                    escala.setUsuario(usuario);
                    escala.setData(dataAtual);
                }

                escala.setHorarioInicio(dto.getHorarioInicio());
                escala.setHorarioFim(dto.getHorarioFim());
                escala.setTipo(dto.getTipo());
                escala.setObservacao(dto.getObservacao());

                escalaRepository.save(escala);
            }

            dataAtual = dataAtual.plusDays(1);
        }
    }
    // ---------------------------------------

    public List<EscalaTrabalhoDTO> buscarEscalaPorPeriodo(Long usuarioId, LocalDate inicio, LocalDate fim) {
        List<EscalaTrabalho> escalas = escalaRepository.findByUsuarioIdAndDataBetween(usuarioId, inicio, fim);
        return escalas.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

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