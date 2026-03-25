package com.benfica.encomendas_api.config;

import com.benfica.encomendas_api.model.*;
import com.benfica.encomendas_api.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Configuration
public class DataSeeder {

    private static final Logger logger = LoggerFactory.getLogger(DataSeeder.class);

    @Value("${app.seeder.admin-password:Benfica2026}")
    private String adminPassword;

    @Value("${app.seeder.user-password:Benfica2026}")
    private String userPassword;

    @Bean
    CommandLineRunner initDatabase(
            UsuarioRepository usuarioRepository,
            EquipeRepository equipeRepository,
            PasswordEncoder passwordEncoder,
            PlatformTransactionManager transactionManager) {

        return args -> {
            logger.info("INICIANDO DATA SEEDER");

            // =============================================
            // 1. CRIAR / SINCRONIZAR TODOS OS FUNCIONÁRIOS
            // =============================================

            Usuario gleison = garantirUsuario(usuarioRepository, passwordEncoder,
                    "Gleison de Jesus Afonso de Oliveira", "gleisonafonso@gmail.com",
                    adminPassword, "ROLE_ADMIN", null,
                    "076.395.496-98", "32 99130-1319");

            List<Usuario> funcionarios = new ArrayList<>();
            funcionarios.add(gleison);

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Andresa Catriene Rodrigues Fernandes", "andresaneves90@gmail.com",
                    userPassword, "ROLE_USER", "Caixa",
                    "114.729.506-90", "32 99994-5914"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Antonia de Souza Leite", "claidiziasousa9@gmail.com",
                    userPassword, "ROLE_USER", "Serviços Gerais",
                    "030.836.973-41", "32 99811-9208"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Brenda Caroline Lima Ferreira", "brecaroline78@gmail.com",
                    userPassword, "ROLE_USER", "Vendedora",
                    "130.478.746-03", "32 98874-2702"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Carine Fernanda de Oliveira", "carinefernanda199@gmail.com",
                    userPassword, "ROLE_USER", "Caixa",
                    "127.531.286-18", "32 99950-8028"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Cidclei Marques de Andrade", "cidcleicidclei@gmail.com",
                    userPassword, "ROLE_USER", "Vendedor",
                    "075.846.697-86", "32 99153-5649"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Daniel Cesar Gama Martins", "dgama1001avontsplay@gmail.com",
                    userPassword, "ROLE_USER", "Motoboy",
                    "130.477.026-59", "32 99964-8988"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Davi Rochet", "davi4rochet6@gmail.com",
                    userPassword, "ROLE_USER", "Farmacêutico",
                    "077.975.106-01", "32 98703-1914"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Flaviana Mercedes da Silva", "silvaflaviana27543@gmail.com",
                    userPassword, "ROLE_USER", "Serviços Gerais",
                    "133.799.956-30", "32 99819-2031"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Francisco Marques Neto", "franciscomarques581@gmail.com",
                    userPassword, "ROLE_USER", "Vendedor",
                    "078.520.746-50", "32 98727-0246"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Gabriela Ribeiro de Paula", "gabrielaribeiro2323@gmail.com",
                    userPassword, "ROLE_USER", "Farmacêutica",
                    "110.433.086-52", "32 98811-2215"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Guilherme Ricardo Mendes Santana", "guimendes9177@gmail.com",
                    userPassword, "ROLE_USER", "Motoboy",
                    "123.957.076-78", "32 99177-8192"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "João Pedro de Freitas Bedim", "jpfbedim@gmail.com",
                    userPassword, "ROLE_USER", "Vendedor",
                    "115.215.986-06", "32 99855-6767"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Joao Victor de Souza", "joao.vitorace4@gmail.com",
                    userPassword, "ROLE_USER", "Motoboy",
                    "152.540.916-65", "32 99115-5230"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Luciene Clara de Lima da Cunha", "luiene.lima@gmail.com",
                    userPassword, "ROLE_USER", "Vendedora",
                    "025.975.897-30", "32 99158-0993"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Michele Mara Campos Miranda", "michelemara030@gmail.com",
                    userPassword, "ROLE_USER", "Caixa",
                    "097.341.096-50", "32 99139-4953"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Milena Fernandes", "milenafernandeshosken@gmail.com",
                    userPassword, "ROLE_USER", "Vendedora",
                    "150.951.276-44", "32 98026-6083"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Natanaely Casimiro Mattos", "natanaelymattos@gmail.com",
                    userPassword, "ROLE_USER", "Vendedora",
                    "106.521.556-85", "32 99848-1663"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Patricia Alessandra Leonido Peres", "patyperes98@gmail.com",
                    userPassword, "ROLE_USER", "Vendedora",
                    "037.716.176-42", "32 99918-3659"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Paula Silva de Almeida", "paulaalmeidaadm@gmail.com",
                    userPassword, "ROLE_USER", "Caixa",
                    "106.901.456-75", "32 99156-6575"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Paulo Pires Silva", "paulopires2008.2@hotmail.com",
                    userPassword, "ROLE_USER", "Caixa",
                    "022.860.754-09", "32 99950-1689"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Paulo Rogerio da Silva", "paulosilvabenfica76@gmail.com",
                    userPassword, "ROLE_USER", "Vendedor",
                    "052.866.076-40", "32 93618-2527"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Pureza Raquel da Costa S. Ferreira", "raquelcostta2692@gmail.com",
                    userPassword, "ROLE_USER", "Caixa",
                    "789.454.105-20", "32 99908-2692"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Raul dos Santos Camboim Junior", "raulzito244@gmail.com",
                    userPassword, "ROLE_USER", "Motoboy",
                    "049.128.085-80", "32 99172-5827"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Robson Eduardo da Silva", "robsone289@gmail.com",
                    userPassword, "ROLE_USER", "Motoboy",
                    "104.109.686-09", "32 99146-4809"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Sheyla Francoise Muniz", "sheyla.muniz39@gmail.com",
                    userPassword, "ROLE_USER", "Vendedora",
                    "040.455.206-43", "32 98801-9947"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Wallace Venancio dos Anjos", "venqnciowallace470@gmail.com",
                    userPassword, "ROLE_USER", "Vendedor",
                    "093.600.136-41", "21 97203-4080"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "William da Silva Araujo", "wsaraujo2013@gmail.com",
                    userPassword, "ROLE_USER", "Farmacêutico",
                    "072.736.126-00", "32 98806-0339"));

            logger.info("{} funcionários garantidos.", funcionarios.size());

            // =============================================
            // 2. CRIAR EQUIPE COM GLEISON COMO GERENTE
            // =============================================
            Equipe equipe = equipeRepository.findByNome("Drogaria Benfica - Matriz")
                    .orElseGet(() -> {
                        Equipe nova = new Equipe();
                        nova.setNome("Drogaria Benfica - Matriz");
                        nova.setDescricao("Loja Principal - Centro");
                        nova.setAdministrador(gleison);
                        return equipeRepository.save(nova);
                    });

            // =============================================
            // 3. ADICIONAR TODOS COMO MEMBROS DA EQUIPE
            // =============================================
            TransactionTemplate tm = new TransactionTemplate(transactionManager);
            tm.execute(status -> {
                Equipe eq = equipeRepository.findById(equipe.getId()).orElse(equipe);
                boolean alterou = false;

                for (Usuario u : funcionarios) {
                    if (u.getEquipe() == null || !u.getEquipe().getId().equals(eq.getId())) {
                        u.setEquipe(eq);
                        usuarioRepository.save(u);
                    }
                    boolean jaMembro = eq.getMembros().stream().anyMatch(m -> m.getId().equals(u.getId()));
                    if (!jaMembro) {
                        eq.getMembros().add(u);
                        alterou = true;
                    }
                }

                if (alterou) {
                    equipeRepository.save(eq);
                }
                return null;
            });

            logger.info("Equipe 'Drogaria Benfica - Matriz' com {} membros.", funcionarios.size());
            logger.info("SEEDER CONCLUÍDO COM SUCESSO!");
        };
    }

    private Usuario garantirUsuario(UsuarioRepository repo, PasswordEncoder encoder,
                                     String nome, String email, String senha,
                                     String role, String cargo,
                                     String cpf, String telefone) {
        return repo.findByEmail(email).map(existente -> {
            // Sincroniza dados cadastrais (nunca altera senha de quem já existe)
            boolean alterou = false;
            if (!Objects.equals(existente.getNomeCompleto(), nome)) {
                existente.setNomeCompleto(nome);
                alterou = true;
            }
            if (!Objects.equals(existente.getIdentificacao(), cpf)) {
                existente.setIdentificacao(cpf);
                alterou = true;
            }
            if (!Objects.equals(existente.getTelefone(), telefone)) {
                existente.setTelefone(telefone);
                alterou = true;
            }
            if (!Objects.equals(existente.getCargo(), cargo)) {
                existente.setCargo(cargo);
                alterou = true;
            }
            if (alterou) {
                return repo.save(existente);
            }
            return existente;
        }).orElseGet(() -> {
            Usuario u = new Usuario();
            u.setNomeCompleto(nome);
            u.setEmail(email);
            u.setPassword(encoder.encode(senha));
            u.setRole(role);
            u.setCargo(cargo);
            u.setIdentificacao(cpf);
            u.setTelefone(telefone);
            u.setAtivo(true);
            return repo.save(u);
        });
    }
}
