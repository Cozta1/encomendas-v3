package com.benfica.encomendas_api.service;

import com.benfica.encomendas_api.dto.ConviteResponseDTO;
import com.benfica.encomendas_api.dto.EquipeDTO;
import com.benfica.encomendas_api.dto.EquipeResponseDTO;
import com.benfica.encomendas_api.dto.MembroEquipeResponseDTO;
import com.benfica.encomendas_api.model.Convite;
import com.benfica.encomendas_api.model.Equipe;
import com.benfica.encomendas_api.model.Usuario;
import com.benfica.encomendas_api.repository.ConviteRepository;
import com.benfica.encomendas_api.repository.EquipeRepository;
import com.benfica.encomendas_api.repository.UsuarioRepository;
import com.benfica.encomendas_api.security.TeamContextHolder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class EquipeService {

    @Autowired
    private EquipeRepository equipeRepository;

    @Autowired
    private ConviteRepository conviteRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    // --- LÓGICA DE SEGURANÇA: SUPER ADMIN OU DONO ---
    private void validarPermissaoGestor(Equipe equipe, Usuario usuarioExecutor) {
        boolean isSuperAdmin = "ROLE_SUPER_ADMIN".equals(usuarioExecutor.getRole());
        boolean isDono = equipe.getAdministrador().getId().equals(usuarioExecutor.getId());

        if (!isSuperAdmin && !isDono) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Você não tem permissão para gerenciar esta equipe.");
        }
    }
    // ------------------------------------------------

    @Transactional(readOnly = true)
    public List<EquipeResponseDTO> listarEquipesDoUsuario(Usuario usuario) {
        List<Equipe> equipes;

        // Se for Super Admin, vê TODAS
        if ("ROLE_SUPER_ADMIN".equals(usuario.getRole())) {
            equipes = equipeRepository.findAll();
        } else {
            equipes = equipeRepository.findByAdministradorOrMembrosContaining(usuario, usuario);
        }

        return equipes.stream()
                .map(equipe -> {
                    boolean isSuperAdmin = "ROLE_SUPER_ADMIN".equals(usuario.getRole());
                    boolean isOwner = equipe.getAdministrador().getId().equals(usuario.getId());

                    return EquipeResponseDTO.builder()
                            .id(equipe.getId())
                            .nome(equipe.getNome())
                            .nomeAdministrador(equipe.getAdministrador().getNomeCompleto())
                            .isAdmin(isOwner || isSuperAdmin) // Flag Admin para o Frontend
                            .isMember(!isOwner)
                            .build();
                })
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

    // --- GESTÃO DE MEMBROS ---

    @Transactional(readOnly = true)
    public List<MembroEquipeResponseDTO> listarMembrosEquipeAtiva() {
        UUID equipeId = TeamContextHolder.getTeamId();
        if (equipeId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nenhuma equipe ativa selecionada.");
        }

        Equipe equipe = equipeRepository.findById(equipeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Equipe não encontrada"));

        List<MembroEquipeResponseDTO> membrosDTO = new ArrayList<>();

        // Adiciona Administrador
        Usuario admin = equipe.getAdministrador();
        membrosDTO.add(MembroEquipeResponseDTO.builder()
                .id(admin.getId())
                .nomeCompleto(admin.getNomeCompleto())
                .email(admin.getEmail())
                .cargo(admin.getCargo())
                .role("ROLE_ADMIN")
                .build());

        // Adiciona Membros
        if (equipe.getMembros() != null) {
            equipe.getMembros().forEach(membro -> {
                membrosDTO.add(MembroEquipeResponseDTO.builder()
                        .id(membro.getId())
                        .nomeCompleto(membro.getNomeCompleto())
                        .email(membro.getEmail())
                        .cargo(membro.getCargo())
                        .role("ROLE_USER")
                        .build());
            });
        }
        return membrosDTO;
    }

    @Transactional
    public void removerMembro(Long usuarioId, Usuario usuarioExecutor) {
        UUID equipeId = TeamContextHolder.getTeamId();
        Equipe equipe = equipeRepository.findById(equipeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Equipe não encontrada"));

        // Validação de Permissão (Super Admin ou Dono)
        validarPermissaoGestor(equipe, usuarioExecutor);

        // Proteção: Não remover o dono da equipe (nem Super Admin deve fazer isso por esta rota)
        if (equipe.getAdministrador().getId().equals(usuarioId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "O administrador (dono) não pode ser removido da equipe.");
        }

        boolean removido = equipe.getMembros().removeIf(u -> u.getId().equals(usuarioId));

        if (!removido) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Este usuário não é membro desta equipe.");
        }

        equipeRepository.save(equipe);
    }

    // --- CONVITES ---

    @Transactional
    public void enviarConvite(UUID equipeId, String emailDestino, Usuario usuarioExecutor) {
        Equipe equipe = equipeRepository.findById(equipeId)
                .orElseThrow(() -> new RuntimeException("Equipe não encontrada"));

        // Validação de Permissão (Super Admin ou Dono)
        validarPermissaoGestor(equipe, usuarioExecutor);

        boolean jaMembro = equipe.getMembros().stream().anyMatch(u -> u.getEmail().equalsIgnoreCase(emailDestino));
        if (jaMembro || equipe.getAdministrador().getEmail().equalsIgnoreCase(emailDestino)) {
            throw new RuntimeException("Usuário já faz parte da equipe.");
        }

        Convite convite = Convite.builder()
                .equipe(equipe)
                .emailDestino(emailDestino)
                .status("PENDENTE")
                .build();

        conviteRepository.save(convite);
    }

    @Transactional(readOnly = true)
    public List<ConviteResponseDTO> listarConvitesDaEquipe(UUID equipeId, Usuario usuarioExecutor) {
        Equipe equipe = equipeRepository.findById(equipeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Equipe não encontrada"));

        // Validação de Permissão (Super Admin ou Dono)
        validarPermissaoGestor(equipe, usuarioExecutor);

        return conviteRepository.findByEquipeId(equipeId).stream()
                .map(ConviteResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ConviteResponseDTO> listarConvitesPendentesDoUsuario(String emailUsuario) {
        return conviteRepository.findByEmailDestinoAndStatus(emailUsuario, "PENDENTE").stream()
                .map(ConviteResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public void aceitarConvite(UUID conviteId) {
        Convite convite = conviteRepository.findById(conviteId)
                .orElseThrow(() -> new RuntimeException("Convite não encontrado"));

        if (!"PENDENTE".equals(convite.getStatus())) {
            throw new RuntimeException("Este convite não está mais pendente.");
        }

        convite.setStatus("ACEITO");
        conviteRepository.save(convite);

        Usuario novoMembro = usuarioRepository.findByEmail(convite.getEmailDestino())
                .orElseThrow(() -> new RuntimeException("Usuário convidado não possui conta no sistema."));

        Equipe equipe = convite.getEquipe();
        equipe.getMembros().add(novoMembro);
        equipeRepository.save(equipe);
    }
}