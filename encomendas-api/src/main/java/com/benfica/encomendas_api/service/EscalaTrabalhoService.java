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
import java.util.List;
import java.util.stream.Collectors;

@Service
public class EscalaTrabalhoService {

    @Autowired
    private EscalaTrabalhoRepository escalaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    // --- LEITURA ---
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

        LocalDate atual = dto.getDataInicio();

        // Loop dia a dia
        while (!atual.isAfter(dto.getDataFim())) {
            // Verifica se o dia da semana está na lista de dias selecionados
            // getDayOfWeek().getValue(): 1=Segunda ... 7=Domingo
            // O front envia: 1=Seg ... 7=Dom (compatível)
            if (dto.getDiasSemana().contains(atual.getDayOfWeek().getValue())) {

                // Busca se já existe escala no dia
                EscalaTrabalho escala = escalaRepository.findByUsuarioIdAndData(usuario.getId(), atual);

                if (escala == null) {
                    escala = new EscalaTrabalho();
                    escala.setUsuario(usuario);
                    escala.setData(atual);
                }

                // Atualiza campos
                escala.setTipo(dto.getTipo());
                escala.setHorarioInicio(dto.getHorarioInicio());
                escala.setHorarioFim(dto.getHorarioFim());
                escala.setObservacao(dto.getObservacao());

                escalaRepository.save(escala);
            }
            atual = atual.plusDays(1);
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