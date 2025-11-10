package com.benfica.encomendas_api.controller;

import com.benfica.encomendas_api.dto.JwtAuthenticationResponse;
import com.benfica.encomendas_api.dto.LoginRequest;
import com.benfica.encomendas_api.model.Usuario;
import com.benfica.encomendas_api.repository.UsuarioRepository;
import com.benfica.encomendas_api.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UsuarioRepository usuarioRepository;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Autowired
    JwtTokenProvider tokenProvider;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        // Autentica usando o email como username
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getEmail(),
                        loginRequest.getPassword()
                )
        );

        // Define a autenticação no contexto (opcional para APIs stateless, mas boa prática)
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // Gera o token JWT
        String jwt = tokenProvider.generateToken(authentication);

        // Retorna o token na resposta
        return ResponseEntity.ok(new JwtAuthenticationResponse(jwt));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody Usuario usuario) {
        // Verifica se o email já existe (usando o método que já criamos no repositório)
        if (usuarioRepository.findByEmail(usuario.getEmail()).isPresent()) {
            return new ResponseEntity<>("Erro: Email já está em uso!", HttpStatus.BAD_REQUEST);
        }

        // Codifica a senha antes de salvar
        usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));

        // Salva o usuário
        usuarioRepository.save(usuario);

        return ResponseEntity.ok("Usuário registrado com sucesso!");
    }
}