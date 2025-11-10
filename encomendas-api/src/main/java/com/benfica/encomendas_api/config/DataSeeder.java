package com.benfica.encomendas_api.config;

import com.benfica.encomendas_api.model.Usuario;
import com.benfica.encomendas_api.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner initDatabase(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (usuarioRepository.count() == 0) {
                Usuario admin = Usuario.builder()
                        .nomeCompleto("Admin Inicial")
                        .email("admin@benfica.com")
                        .password(passwordEncoder.encode("admin123"))
                        .cargo("Administrador")
                        .identificacao("00000000000")
                        .ativo(true)
                        .build();

                usuarioRepository.save(admin);
                System.out.println("--------------------------------------");
                System.out.println("ADMIN INICIAL CRIADO COM SUCESSO!");
                System.out.println("Email: admin@benfica.com | Senha: admin123");
                System.out.println("--------------------------------------");
            }
        };
    }
}