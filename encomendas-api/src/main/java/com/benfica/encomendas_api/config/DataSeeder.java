package com.benfica.encomendas_api.config;

import com.benfica.encomendas_api.model.Equipe;
import com.benfica.encomendas_api.model.Usuario;
import com.benfica.encomendas_api.repository.EquipeRepository;
import com.benfica.encomendas_api.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile; // Importante
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Configuration
@Profile("dev") // <-- IMPORTANTE: Isso só roda se o perfil "dev" estiver ativo
public class DataSeeder {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    @Bean
    @Transactional // Necessário para operações complexas de limpeza e criação
    CommandLineRunner initDatabase(UsuarioRepository usuarioRepository,
                                   EquipeRepository equipeRepository,
                                   PasswordEncoder passwordEncoder) {

        return args -> {
            // 1. LIMPAR O BANCO DE DADOS
            // Devemos apagar as equipes primeiro, pois elas têm a chave estrangeira (administrador_id)
            log.info("--- LIMPANDO BANCO DE DADOS (Equipes e Usuários) ---");
            equipeRepository.deleteAll();
            usuarioRepository.deleteAll();
            log.info("--- BANCO DE DADOS LIMPO ---");

            // 2. CRIAR USUÁRIOS
            log.info("--- CRIANDO USUÁRIOS PADRÃO ---");
            String senhaPadrao = passwordEncoder.encode("admin123");

            Usuario adminUser = Usuario.builder()
                    .nomeCompleto("Admin Principal (Benfica)")
                    .email("admin@benfica.com")
                    .password(senhaPadrao)
                    .identificacao("00000000001")
                    .cargo("Admin Geral")
                    .ativo(true)
                    .build();

            Usuario funcUser = Usuario.builder()
                    .nomeCompleto("Funcionario Teste (Silva)")
                    .email("func@benfica.com")
                    .password(senhaPadrao)
                    .identificacao("11122233344")
                    .cargo("Farmacêutico")
                    .ativo(true)
                    .build();

            // Salva os usuários no banco
            usuarioRepository.saveAll(List.of(adminUser, funcUser));
            log.info("Criados {} usuários.", usuarioRepository.count());

            // 3. CRIAR EQUIPES (FARMÁCIAS)
            log.info("--- CRIANDO EQUIPES PADRÃO ---");

            Equipe equipeCentro = Equipe.builder()
                    .nome("Farmácia Benfica - Centro")
                    .descricao("Filial principal no centro da cidade.")
                    .administrador(adminUser) // AdminUser é o dono
                    .ativa(true)
                    .build();

            Equipe equipeMatriz = Equipe.builder()
                    .nome("Farmácia Benfica - Matriz (Sede)")
                    .descricao("Administração central e logística.")
                    .administrador(adminUser) // AdminUser também é o dono
                    .ativa(true)
                    .build();

            Equipe equipeBairro = Equipe.builder()
                    .nome("Drogaria Silva - Bairro")
                    .descricao("Filial do bairro, administrada pelo Funcionario Teste.")
                    .administrador(funcUser) // FuncUser é o dono
                    .ativa(true)
                    .build();

            // Salva as equipes no banco
            equipeRepository.saveAll(List.of(equipeCentro, equipeMatriz, equipeBairro));
            log.info("Criadas {} equipes.", equipeRepository.count());

            log.info("--- BANCO DE DADOS POPULADO COM SUCESSO (PERFIL DEV) ---");
        };
    }
}