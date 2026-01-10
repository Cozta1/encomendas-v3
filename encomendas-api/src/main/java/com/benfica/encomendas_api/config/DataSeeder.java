package com.benfica.encomendas_api.config;

import com.benfica.encomendas_api.model.*;
import com.benfica.encomendas_api.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Configuration
@Profile("dev")
public class DataSeeder {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    @Value("${app.super-admin.email:super@benfica.com}")
    private String superAdminEmail;

    @Value("${app.super-admin.password:admin123}")
    private String superAdminPassword;

    @Value("${app.super-admin.name:Super Administrador}")
    private String superAdminName;

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

            // 1. Limpa tabelas dependentes (filhas)
            encomendaItemRepository.deleteAll();
            encomendaRepository.deleteAll();
            produtoRepository.deleteAll();
            fornecedorRepository.deleteAll();
            clienteRepository.deleteAll();
            conviteRepository.deleteAll();

            // 2. Quebra a dependência circular (Usuario <-> Equipe)
            // Remove a referência de equipe dos usuários
            List<Usuario> usuariosExistentes = usuarioRepository.findAll();
            for (Usuario u : usuariosExistentes) {
                u.setEquipe(null);
            }
            usuarioRepository.saveAll(usuariosExistentes);

            // Remove a referência de administrador das equipes
            List<Equipe> equipesExistentes = equipeRepository.findAll();
            for (Equipe e : equipesExistentes) {
                e.setAdministrador(null);
            }
            equipeRepository.saveAll(equipesExistentes);

            // 3. Agora pode excluir com segurança
            equipeRepository.deleteAll();
            usuarioRepository.deleteAll();

            log.info("--- BANCO DE DADOS LIMPO ---");

            // --- INÍCIO DA CRIAÇÃO DE DADOS (POPULATE) ---
            log.info("--- CRIANDO USUÁRIOS E EQUIPES ---");

            String senhaPadrao = passwordEncoder.encode("admin123");
            String senhaSuper = passwordEncoder.encode(superAdminPassword);

            // Super Admin
            Usuario superAdmin = Usuario.builder()
                    .nomeCompleto(superAdminName)
                    .email(superAdminEmail)
                    .password(senhaSuper)
                    .identificacao("99999999999")
                    .cargo("CEO / Gestor Geral")
                    .role("ROLE_SUPER_ADMIN")
                    .ativo(true)
                    .build();

            // Admin da Equipe Centro
            Usuario adminUser = Usuario.builder()
                    .nomeCompleto("Admin Principal (Benfica)")
                    .email("admin@benfica.com")
                    .password(senhaPadrao)
                    .identificacao("00000000001")
                    .cargo("Farmacêutico Gerente")
                    .role("ROLE_ADMIN")
                    .ativo(true)
                    .build();

            // Funcionário da Equipe Bairro
            Usuario funcUser = Usuario.builder()
                    .nomeCompleto("Funcionario Silva")
                    .email("func@benfica.com")
                    .password(senhaPadrao)
                    .identificacao("11122233344")
                    .cargo("Balconista")
                    .role("ROLE_USER")
                    .ativo(true)
                    .build();

            usuarioRepository.saveAll(List.of(superAdmin, adminUser, funcUser));

            // CRIAR EQUIPES
            Equipe equipeCentro = Equipe.builder()
                    .nome("Farmácia Benfica - Centro")
                    .descricao("Filial Principal - Matriz")
                    .administrador(adminUser)
                    .ativa(true)
                    .build();

            Equipe equipeBairro = Equipe.builder()
                    .nome("Drogaria Silva - Bairro")
                    .descricao("Filial Zona Norte")
                    .administrador(funcUser)
                    .ativa(true)
                    .build();

            equipeRepository.saveAll(List.of(equipeCentro, equipeBairro));

            // ATUALIZA USUÁRIOS COM AS EQUIPES
            adminUser.setEquipe(equipeCentro);
            funcUser.setEquipe(equipeBairro);
            usuarioRepository.saveAll(List.of(adminUser, funcUser));

            // DADOS BASE
            log.info("--- POPULANDO DADOS BASE ---");

            // Clientes
            Cliente cJoao = Cliente.builder().equipe(equipeCentro).nome("João da Silva").cpf("111.111.111-11").email("joao@email.com").telefone("(32) 99999-1111").build();
            Cliente cMaria = Cliente.builder().equipe(equipeCentro).nome("Maria Oliveira").cpf("222.222.222-22").email("maria@email.com").telefone("(32) 99999-2222").codigoInterno("CLI-002").build();
            Cliente cPedro = Cliente.builder().equipe(equipeCentro).nome("Pedro Atrasado").cpf("333.333.333-33").email("pedro@email.com").telefone("(32) 99999-3333").build();
            clienteRepository.saveAll(List.of(cJoao, cMaria, cPedro));

            // Fornecedores
            Fornecedor fSantaCruz = Fornecedor.builder().equipe(equipeCentro).nome("Santa Cruz Distribuidora").telefone("0800 111 222").build();
            Fornecedor fPanpharma = Fornecedor.builder().equipe(equipeCentro).nome("Panpharma").telefone("0800 333 444").build();
            fornecedorRepository.saveAll(List.of(fSantaCruz, fPanpharma));

            // Produtos
            Produto pDipirona = Produto.builder().equipe(equipeCentro).nome("Dipirona 500mg (EMS)").codigo("789111").precoBase(new BigDecimal("4.50")).build();
            Produto pTorsilax = Produto.builder().equipe(equipeCentro).nome("Torsilax 30cp").codigo("789222").precoBase(new BigDecimal("18.90")).build();
            Produto pVitamina = Produto.builder().equipe(equipeCentro).nome("Vitamina C 1g").codigo("789333").precoBase(new BigDecimal("22.00")).build();
            produtoRepository.saveAll(List.of(pDipirona, pTorsilax, pVitamina));

            // ENCOMENDAS DE TESTE
            log.info("--- GERANDO ENCOMENDAS DE TESTE ---");

            // #1 - Status: Encomenda Criada (Data Futura - Em dia)
            criarEncomenda(encomendaRepository, encomendaItemRepository, equipeCentro, cJoao,
                    "Encomenda Criada",
                    LocalDateTime.now().plusDays(2),
                    BigDecimal.ZERO,
                    "Cliente vai passar para pagar na retirada.",
                    false, false,
                    pDipirona, fSantaCruz, 2, new BigDecimal("4.50"));

            // #2 - Status: Mercadoria em Loja (Data Futura - Em dia)
            criarEncomenda(encomendaRepository, encomendaItemRepository, equipeCentro, cMaria,
                    "Mercadoria em Loja",
                    LocalDateTime.now().plusDays(1),
                    new BigDecimal("10.00"),
                    "Chegou hoje cedo. Cliente avisada.",
                    false, false,
                    pTorsilax, fPanpharma, 1, new BigDecimal("18.90"));

            // #3 - Status: Aguardando Entrega (Data Futura - Em dia)
            criarEncomenda(encomendaRepository, encomendaItemRepository, equipeCentro, cJoao,
                    "Aguardando Entrega",
                    LocalDateTime.now().plusHours(4),
                    new BigDecimal("50.00"),
                    "Motoboy saiu para entrega.",
                    true, false,
                    pVitamina, fSantaCruz, 2, new BigDecimal("22.00"));

            // #4 - Status: Concluído (Histórico)
            criarEncomenda(encomendaRepository, encomendaItemRepository, equipeCentro, cMaria,
                    "Concluído",
                    LocalDateTime.now().minusDays(5),
                    BigDecimal.ZERO,
                    "Entregue semana passada.",
                    false, false,
                    pDipirona, fPanpharma, 5, new BigDecimal("4.00"));

            // #5 - Status: Cancelado
            criarEncomenda(encomendaRepository, encomendaItemRepository, equipeCentro, cPedro,
                    "Cancelado",
                    LocalDateTime.now().plusDays(10),
                    BigDecimal.ZERO,
                    "Cliente desistiu da compra.",
                    false, false,
                    pTorsilax, fSantaCruz, 1, new BigDecimal("18.90"));

            // #6 - Status: Encomenda Criada (ATRASADA!)
            criarEncomenda(encomendaRepository, encomendaItemRepository, equipeCentro, cPedro,
                    "Encomenda Criada",
                    LocalDateTime.now().minusDays(2), // Data Passada!
                    BigDecimal.ZERO,
                    "URGENTE: Estava previsto para antes de ontem!",
                    false, true, // Venda Estoque Negativo
                    pVitamina, fPanpharma, 1, new BigDecimal("22.00"));

            // #7 - Status: Mercadoria em Loja (ATRASADA!)
            criarEncomenda(encomendaRepository, encomendaItemRepository, equipeCentro, cMaria,
                    "Mercadoria em Loja",
                    LocalDateTime.now().minusHours(5), // Data Passada
                    new BigDecimal("5.00"),
                    "Esqueceram de dar baixa ou cliente não veio.",
                    false, false,
                    pDipirona, fSantaCruz, 10, new BigDecimal("4.20"));

            // #8 - Teste Flags
            criarEncomenda(encomendaRepository, encomendaItemRepository, equipeCentro, cJoao,
                    "Encomenda Criada",
                    LocalDateTime.now().plusDays(7),
                    BigDecimal.ZERO,
                    "Teste de flags ativadas.",
                    true, true,
                    pTorsilax, fPanpharma, 3, new BigDecimal("18.00"));

            log.info("--- BANCO DE DADOS POPULADO COM SUCESSO ---");
        };
    }

    private void criarEncomenda(EncomendaRepository encomendaRepo,
                                EncomendaItemRepository itemRepo,
                                Equipe equipe,
                                Cliente cliente,
                                String status,
                                LocalDateTime dataEstimada,
                                BigDecimal adiantamento,
                                String obs,
                                boolean notaFutura,
                                boolean estoqueNegativo,
                                Produto produto,
                                Fornecedor fornecedor,
                                int quantidade,
                                BigDecimal precoCotado) {

        BigDecimal subtotal = precoCotado.multiply(new BigDecimal(quantidade));

        Encomenda enc = Encomenda.builder()
                .equipe(equipe)
                .cliente(cliente)
                .status(status)
                .dataCriacao(LocalDateTime.now())
                .dataEstimadaEntrega(dataEstimada)
                .valorAdiantamento(adiantamento)
                .valorTotal(subtotal)
                .observacoes(obs)
                .notaFutura(notaFutura)
                .vendaEstoqueNegativo(estoqueNegativo)
                .enderecoCep("36000-000")
                .enderecoBairro("Centro")
                .enderecoRua("Rua Halfeld")
                .enderecoNumero("100")
                .build();

        enc = encomendaRepo.save(enc);

        EncomendaItem item = EncomendaItem.builder()
                .encomenda(enc)
                .produto(produto)
                .fornecedor(fornecedor)
                .quantidade(quantidade)
                .precoCotado(precoCotado)
                .subtotal(subtotal)
                .build();

        itemRepo.save(item);
        enc.setItens(List.of(item));
        encomendaRepo.save(enc);
    }
}