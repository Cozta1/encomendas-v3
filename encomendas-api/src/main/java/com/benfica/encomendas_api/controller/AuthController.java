package com.benfica.encomendas_api.controller;

import com.benfica.encomendas_api.dto.*;
import com.benfica.encomendas_api.model.Usuario;
import com.benfica.encomendas_api.repository.UsuarioRepository;
import com.benfica.encomendas_api.security.JwtTokenProvider;
import com.benfica.encomendas_api.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Random;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired AuthenticationManager authenticationManager;
    @Autowired UsuarioRepository usuarioRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JwtTokenProvider tokenProvider;
    @Autowired EmailService emailService;

    @Value("${app.registrationKey}")
    private String userRegistrationKey;

    @Value("${app.adminRegistrationKey:FARMACIA_ADMIN_MASTER}")
    private String adminRegistrationKey;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        // --- CORREÇÃO DO ERRO ANTERIOR ---
        // Pega o usuário autenticado para extrair role e nome
        Usuario user = (Usuario) authentication.getPrincipal();

        // Passa os 3 argumentos requeridos: token, role, nome
        return ResponseEntity.ok(new JwtAuthenticationResponse(jwt, user.getRole(), user.getNomeCompleto()));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody RegisterRequestDTO dto) {
        String roleDefinida;

        if (adminRegistrationKey.equals(dto.getRegistrationKey())) {
            roleDefinida = "ROLE_ADMIN";
        } else if (userRegistrationKey.equals(dto.getRegistrationKey())) {
            roleDefinida = "ROLE_USER";
        } else {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Chave de registo inválida!");
        }

        if (usuarioRepository.findByEmail(dto.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Erro: Email já está em uso!");
        }

        Usuario usuario = Usuario.builder()
                .nomeCompleto(dto.getNomeCompleto())
                .email(dto.getEmail())
                .password(passwordEncoder.encode(dto.getPassword()))
                .identificacao(dto.getIdentificacao())
                .telefone(dto.getTelefone())
                .cargo("Usuário")
                .role(roleDefinida)
                .ativo(true)
                .build();

        usuarioRepository.save(usuario);
        return ResponseEntity.ok("Usuário registado com sucesso! Permissão: " + roleDefinida);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordDTO dto) {
        Usuario usuario = usuarioRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new RuntimeException("Email não encontrado."));

        String codigo = String.format("%06d", new Random().nextInt(999999));
        usuario.setTokenResetSenha(codigo);
        usuario.setDataExpiracaoToken(LocalDateTime.now().plusMinutes(15));
        usuarioRepository.save(usuario);

        emailService.enviarEmail(usuario.getEmail(), "Recuperação de Senha", "Código: " + codigo);

        return ResponseEntity.ok("Código enviado.");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordDTO dto) {
        Usuario usuario = usuarioRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new RuntimeException("Email não encontrado."));

        if (usuario.getTokenResetSenha() == null || !usuario.getTokenResetSenha().equals(dto.getToken())) {
            return ResponseEntity.badRequest().body("Código inválido.");
        }
        if (usuario.getDataExpiracaoToken().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body("Código expirado.");
        }

        usuario.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        usuario.setTokenResetSenha(null);
        usuario.setDataExpiracaoToken(null);
        usuarioRepository.save(usuario);

        return ResponseEntity.ok("Senha alterada com sucesso!");
    }
}