package com.benfica.encomendas_api.service;

import com.benfica.encomendas_api.dto.ConviteResponseDTO;
import com.benfica.encomendas_api.dto.EquipeDTO;
import com.benfica.encomendas_api.dto.EquipeResponseDTO;
import com.benfica.encomendas_api.model.Convite;
import com.benfica.encomendas_api.model.Equipe;
import com.benfica.encomendas_api.model.Usuario;
import com.benfica.encomendas_api.repository.ConviteRepository;
import com.benfica.encomendas_api.repository.EquipeRepository;
import com.benfica.encomendas_api.repository.UsuarioRepository; // Importar
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private UsuarioRepository usuarioRepository; // Injetar para buscar o usuário pelo email

    @Autowired
    private EmailService emailService;

    // --- Listar Equipes (ATUALIZADO) ---
    @Transactional(readOnly = true)
    public List<EquipeResponseDTO> listarEquipesDoUsuario(Usuario usuario) {
        // Agora busca onde ele é DONO ou MEMBRO
        List<Equipe> equipes = equipeRepository.findByAdministradorOrMembrosContaining(usuario, usuario);

        return equipes.stream()
                .map(equipe -> EquipeResponseDTO.builder()
                        .id(equipe.getId())
                        .nome(equipe.getNome())
                        .nomeAdministrador(equipe.getAdministrador().getNomeCompleto())
                        .isAdmin(equipe.getAdministrador().getId().equals(usuario.getId()))
                        // Se não é admin, então é membro
                        .isMember(!equipe.getAdministrador().getId().equals(usuario.getId()))
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

    // --- LÓGICA DE CONVITES ---

    @Transactional
    public void enviarConvite(UUID equipeId, String emailDestino) {
        Equipe equipe = equipeRepository.findById(equipeId)
                .orElseThrow(() -> new RuntimeException("Equipe não encontrada"));

        // (Opcional) Verificar se já é membro
        boolean jaMembro = equipe.getMembros().stream()
                .anyMatch(u -> u.getEmail().equalsIgnoreCase(emailDestino));
        if (jaMembro || equipe.getAdministrador().getEmail().equalsIgnoreCase(emailDestino)) {
            throw new RuntimeException("Usuário já faz parte da equipe.");
        }

        Convite convite = Convite.builder()
                .equipe(equipe)
                .emailDestino(emailDestino)
                .status("PENDENTE")
                .build();

        conviteRepository.save(convite);
        emailService.enviarEmail(emailDestino, "Convite para Equipe",
                "Você foi convidado para a equipe: " + equipe.getNome());
    }

    @Transactional(readOnly = true)
    public List<ConviteResponseDTO> listarConvitesDaEquipe(UUID equipeId) {
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

    // --- Aceitar Convite (ATUALIZADO) ---
    @Transactional
    public void aceitarConvite(UUID conviteId) {
        Convite convite = conviteRepository.findById(conviteId)
                .orElseThrow(() -> new RuntimeException("Convite não encontrado"));

        if (!"PENDENTE".equals(convite.getStatus())) {
            throw new RuntimeException("Este convite não está mais pendente.");
        }

        // 1. Atualiza status do convite
        convite.setStatus("ACEITO");
        conviteRepository.save(convite);

        // 2. Busca o usuário que foi convidado (pelo email do convite)
        Usuario novoMembro = usuarioRepository.findByEmail(convite.getEmailDestino())
                .orElseThrow(() -> new RuntimeException("Usuário convidado não possui conta no sistema."));

        // 3. Adiciona à equipe
        Equipe equipe = convite.getEquipe();
        equipe.getMembros().add(novoMembro);
        equipeRepository.save(equipe);
    }
}