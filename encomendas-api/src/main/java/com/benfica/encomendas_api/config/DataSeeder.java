package com.benfica.encomendas_api.config;

import com.benfica.encomendas_api.model.*;
import com.benfica.encomendas_api.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value; // Importante
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Configuration
@Profile("dev")
public class DataSeeder {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    // --- Injetando valores do application.properties ---
    @Value("${app.super-admin.email:super@benfica.com}")
    private String superAdminEmail;

    @Value("${app.super-admin.password:admin123}")
    private String superAdminPassword;

    @Value("${app.super-admin.name:Super Administrador}")
    private String superAdminName;
    // ---------------------------------------------------

    @Bean
    @Transactional
    CommandLineRunner initDatabase(UsuarioRepository usuarioRepository,
                                   EquipeRepository equipeRepository,
                                   ClienteRepository clienteRepository,
                                   FornecedorRepository fornecedorRepository,
                                   ProdutoRepository produtoRepository,
                                   EncomendaRepository encomendaRepository,
                                   EncomendaItemRepository encomendaItemRepository,
                                   ConviteRepository conviteRepository,
                                   PasswordEncoder passwordEncoder) {

        return args -> {
            log.info("--- LIMPANDO BANCO DE DADOS (PERFIL DEV) ---");
            encomendaItemRepository.deleteAll();
            encomendaRepository.deleteAll();
            produtoRepository.deleteAll();
            fornecedorRepository.deleteAll();
            clienteRepository.deleteAll();
            conviteRepository.deleteAll();
            equipeRepository.deleteAll();
            usuarioRepository.deleteAll();
            log.info("--- BANCO DE DADOS LIMPO ---");

            // 2. CRIAR USUÁRIOS
            log.info("--- CRIANDO USUÁRIOS PADRÃO ---");

            String senhaPadrao = passwordEncoder.encode("admin123");
            // Codifica a senha que veio do properties
            String senhaSuper = passwordEncoder.encode(superAdminPassword);

            // --- SUPER ADMIN (Vem do application.properties) ---
            Usuario superAdmin = Usuario.builder()
                    .nomeCompleto(superAdminName)
                    .email(superAdminEmail)
                    .password(senhaSuper)
                    .identificacao("99999999999")
                    .cargo("CEO / Gestor Geral")
                    .role("ROLE_SUPER_ADMIN") // Role definida no código, credenciais no properties
                    .ativo(true)
                    .build();
            // --------------------------------------------------

            Usuario adminUser = Usuario.builder()
                    .nomeCompleto("Admin Principal (Benfica)")
                    .email("admin@benfica.com")
                    .password(senhaPadrao)
                    .identificacao("00000000001")
                    .cargo("Admin Geral")
                    .role("ROLE_ADMIN")
                    .ativo(true)
                    .build();

            Usuario funcUser = Usuario.builder()
                    .nomeCompleto("Funcionario Teste (Silva)")
                    .email("func@benfica.com")
                    .password(senhaPadrao)
                    .identificacao("11122233344")
                    .cargo("Farmacêutico")
                    .role("ROLE_USER")
                    .ativo(true)
                    .build();

            usuarioRepository.saveAll(List.of(superAdmin, adminUser, funcUser));
            log.info("Usuários criados. Super Admin: {}", superAdminEmail);

            // ... (O restante do código de Equipes, Clientes, etc. permanece igual) ...

            // 3. CRIAR EQUIPES (Resumido para não ocupar espaço, mantenha o seu código original abaixo)
            Equipe equipeCentro = Equipe.builder().nome("Farmácia Benfica - Centro").descricao("Filial principal").administrador(adminUser).ativa(true).build();
            Equipe equipeBairro = Equipe.builder().nome("Drogaria Silva - Bairro").descricao("Filial bairro").administrador(funcUser).ativa(true).build();
            equipeRepository.saveAll(List.of(equipeCentro, equipeBairro));

            // ... (Mantenha o resto da criação de Clientes, Fornecedores, Produtos e Encomendas) ...

            log.info("--- BANCO DE DADOS POPULADO COM SUCESSO ---");
        };
    }
}