package com.benfica.encomendas_api.service;

import com.benfica.encomendas_api.dto.EscalaReplicacaoDTO;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class EscalaTrabalhoService {

    @Autowired
    private EscalaTrabalhoRepository escalaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    // --- LEITURA ---
    @Transactional(readOnly = true)
    public List<EscalaTrabalhoDTO> getEscalas(Long usuarioId, LocalDate inicio, LocalDate fim) {
        List<EscalaTrabalho> escalas = escalaRepository.findByUsuarioIdAndDataBetween(usuarioId, inicio, fim);
        return escalas.stream().map(this::toDTO).collect(Collectors.toList());
    }

    // --- SALVAR (Upsert: Cria ou Atualiza) ---
    @Transactional
    public EscalaTrabalhoDTO salvarEscala(EscalaTrabalhoDTO dto) {
        Usuario usuario = usuarioRepository.findById(dto.getUsuarioId())
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));

        // VERIFICAÇÃO IMPORTANTE: Busca se já existe escala neste dia
        EscalaTrabalho escala = escalaRepository.findByUsuarioIdAndData(dto.getUsuarioId(), dto.getData());

        if (escala == null) {
            // Se não existe, cria nova
            escala = new EscalaTrabalho();
            escala.setUsuario(usuario);
            escala.setData(dto.getData());
        }

        // Atualiza os dados (seja nova ou existente)
        escala.setTipo(dto.getTipo());
        escala.setHorarioInicio(dto.getHorarioInicio());
        escala.setHorarioFim(dto.getHorarioFim());
        escala.setObservacao(dto.getObservacao());

        EscalaTrabalho salva = escalaRepository.save(escala);
        return toDTO(salva);
    }

    // --- REPLICAÇÃO (Upsert em lote) ---
    @Transactional
    public void replicarEscala(EscalaReplicacaoDTO dto) {
        Usuario usuario = usuarioRepository.findById(dto.getUsuarioId())
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));

        // Pré-carrega todas as escalas do período de uma só vez (evita N SELECT por dia)
        Map<LocalDate, EscalaTrabalho> existentes = escalaRepository
                .findByUsuarioIdAndDataBetween(usuario.getId(), dto.getDataInicio(), dto.getDataFim())
                .stream()
                .collect(Collectors.toMap(EscalaTrabalho::getData, e -> e));

        List<EscalaTrabalho> paraSalvar = new ArrayList<>();
        LocalDate atual = dto.getDataInicio();

        while (!atual.isAfter(dto.getDataFim())) {
            // getDayOfWeek().getValue(): 1=Segunda ... 7=Domingo (compatível com o front)
            if (dto.getDiasSemana().contains(atual.getDayOfWeek().getValue())) {
                EscalaTrabalho escala = existentes.getOrDefault(atual, null);

                if (escala == null) {
                    escala = new EscalaTrabalho();
                    escala.setUsuario(usuario);
                    escala.setData(atual);
                }

                escala.setTipo(dto.getTipo());
                escala.setHorarioInicio(dto.getHorarioInicio());
                escala.setHorarioFim(dto.getHorarioFim());
                escala.setObservacao(dto.getObservacao());

                paraSalvar.add(escala);
            }
            atual = atual.plusDays(1);
        }

        if (!paraSalvar.isEmpty()) {
            escalaRepository.saveAll(paraSalvar);
        }
    }

    // --- MAPPER ---
    private EscalaTrabalhoDTO toDTO(EscalaTrabalho entity) {
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