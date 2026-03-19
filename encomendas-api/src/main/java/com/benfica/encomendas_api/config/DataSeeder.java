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

@Configuration
public class DataSeeder {

    private static final Logger logger = LoggerFactory.getLogger(DataSeeder.class);

    @Value("${app.seeder.admin-password:Admin@Temp123}")
    private String adminPassword;

    @Value("${app.seeder.user-password:User@Temp123}")
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
            // 1. CRIAR TODOS OS FUNCIONÁRIOS
            // =============================================

            // Gleison - Gerente (ADMIN)
            Usuario gleison = garantirUsuario(usuarioRepository, passwordEncoder,
                    "Gleison de Jesus Afonso de Oliveira", "gleisonafonso@gmail.com",
                    adminPassword, "ROLE_ADMIN", null, "000.000.000-01", "00 00000-0001");

            // Funcionários (ROLE_USER)
            List<Usuario> funcionarios = new ArrayList<>();
            funcionarios.add(gleison);

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Andresa Catriene Rodrigues Fernandes", "andresaneves90@gmail.com",
                    userPassword, "ROLE_USER", "Caixa", "000.000.000-02", "00 00000-0002"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Antonia de Souza Leite", "claidiziasousa9@gmail.com",
                    userPassword, "ROLE_USER", "Serviços Gerais", "000.000.000-03", "00 00000-0003"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Brenda Caroline Lima Ferreira", "brecaroline78@gmail.com",
                    userPassword, "ROLE_USER", "Vendedora", "000.000.000-04", "00 00000-0004"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Carine Fernanda de Oliveira", "carinefernanda199@gmail.com",
                    userPassword, "ROLE_USER", "Caixa", "000.000.000-05", "00 00000-0005"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Cidclei Marques de Andrade", "cidcleicidclei@gmail.com",
                    userPassword, "ROLE_USER", "Vendedor", "000.000.000-06", "00 00000-0006"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Daniel Cesar Gama Martins", "dgama1001avontsplay@gmail.com",
                    userPassword, "ROLE_USER", "Motoboy", "000.000.000-07", "00 00000-0007"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Davi Rochet", "davi4rochet6@gmail.com",
                    userPassword, "ROLE_USER", "Farmacêutico", "000.000.000-08", "00 00000-0008"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Flaviana Mercedes da Silva", "silvaflaviana27543@gmail.com",
                    userPassword, "ROLE_USER", "Serviços Gerais", "000.000.000-09", "00 00000-0009"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Francisco Marques Neto", "franciscomarques581@gmail.com",
                    userPassword, "ROLE_USER", "Vendedor", "000.000.000-10", "00 00000-0010"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Gabriela Ribeiro de Paula", "gabrielaribeiro2323@gmail.com",
                    userPassword, "ROLE_USER", "Farmacêutica", "000.000.000-11", "00 00000-0011"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Guilherme Ricardo Mendes Santana", "guimendes9177@gmail.com",
                    userPassword, "ROLE_USER", "Motoboy", "000.000.000-12", "00 00000-0012"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "João Pedro de Freitas Bedim", "jpfbedim@gmail.com",
                    userPassword, "ROLE_USER", "Vendedor", "000.000.000-13", "00 00000-0013"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Joao Victor de Souza", "joao.vitorace4@gmail.com",
                    userPassword, "ROLE_USER", "Motoboy", "000.000.000-14", "00 00000-0014"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Luciene Clara de Lima da Cunha", "luiene.lima@gmail.com",
                    userPassword, "ROLE_USER", "Vendedora", "000.000.000-15", "00 00000-0015"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Michele Mara Campos Miranda", "michelemara030@gmail.com",
                    userPassword, "ROLE_USER", "Caixa", "000.000.000-16", "00 00000-0016"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Milena Fernandes", "milenafernandeshosken@gmail.com",
                    userPassword, "ROLE_USER", "Vendedora", "000.000.000-17", "00 00000-0017"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Natanaely Casimiro Mattos", "natanaelymattos@gmail.com",
                    userPassword, "ROLE_USER", "Vendedora", "000.000.000-18", "00 00000-0018"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Patricia Alessandra Leonido Peres", "patyperes98@gmail.com",
                    userPassword, "ROLE_USER", "Vendedora", "000.000.000-19", "00 00000-0019"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Paula Silva de Almeida", "paulaalmeidaadm@gmail.com",
                    userPassword, "ROLE_USER", "Caixa", "000.000.000-20", "00 00000-0020"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Paulo Pires Silva", "paulopires2008.2@hotmail.com",
                    userPassword, "ROLE_USER", "Caixa", "000.000.000-21", "00 00000-0021"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Paulo Rogerio da Silva", "paulosilvabenfica76@gmail.com",
                    userPassword, "ROLE_USER", "Vendedor", "000.000.000-22", "00 00000-0022"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Pureza Raquel da Costa S. Ferreira", "raquelcostta2692@gmail.com",
                    userPassword, "ROLE_USER", "Caixa", "000.000.000-23", "00 00000-0023"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Raul dos Santos Camboim Junior", "raulzito244@gmail.com",
                    userPassword, "ROLE_USER", "Motoboy", "000.000.000-24", "00 00000-0024"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Robson Eduardo da Silva", "robsone289@gmail.com",
                    userPassword, "ROLE_USER", "Motoboy", "000.000.000-25", "00 00000-0025"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Sheyla Francoise Muniz", "sheyla.muniz39@gmail.com",
                    userPassword, "ROLE_USER", "Vendedora", "000.000.000-26", "00 00000-0026"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "Wallace Venancio dos Anjos", "venqnciowallace470@gmail.com",
                    userPassword, "ROLE_USER", "Vendedor", "000.000.000-27", "00 00000-0027"));

            funcionarios.add(garantirUsuario(usuarioRepository, passwordEncoder,
                    "William da Silva Araujo", "wsaraujo2013@gmail.com",
                    userPassword, "ROLE_USER", "Farmacêutico", "000.000.000-28", "00 00000-0028"));

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
                    // Atualiza o lado do Usuario (ManyToOne)
                    if (u.getEquipe() == null || !u.getEquipe().getId().equals(eq.getId())) {
                        u.setEquipe(eq);
                        usuarioRepository.save(u);
                    }
                    // Atualiza o lado da Equipe (ManyToMany)
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
        return repo.findByEmail(email).orElseGet(() -> {
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
