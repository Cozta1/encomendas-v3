package com.benfica.encomendas_api.config;

import com.benfica.encomendas_api.model.*;
import com.benfica.encomendas_api.repository.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Configuration
@Profile("dev")
public class DataSeeder {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @Value("${app.super-admin.email:super@benfica.com}")
    private String superAdminEmail;

    @Value("${app.super-admin.password:admin123}")
    private String superAdminPassword;

    @Value("${app.super-admin.name:Super Administrador}")
    private String superAdminName;

    @Bean
    public CommandLineRunner initDatabase(UsuarioRepository usuarioRepository,
                                          EquipeRepository equipeRepository,
                                          ClienteRepository clienteRepository,
                                          FornecedorRepository fornecedorRepository,
                                          ProdutoRepository produtoRepository,
                                          EncomendaRepository encomendaRepository,
                                          EncomendaItemRepository encomendaItemRepository,
                                          PasswordEncoder passwordEncoder) {

        return args -> {
            TransactionTemplate tx = new TransactionTemplate(transactionManager);

            // 1. LIMPEZA (Garante transação para o TRUNCATE)
            tx.executeWithoutResult(status -> {
                log.info("--- LIMPANDO BANCO DE DADOS (TRUNCATE CASCADE) ---");
                try {
                    // Executa SQL nativo para limpar tudo ignorando constraints
                    entityManager.createNativeQuery("TRUNCATE TABLE encomenda_historico, encomenda_itens, encomendas, produtos, enderecos, fornecedores, clientes, convites, usuarios, equipes CASCADE").executeUpdate();
                    entityManager.flush();
                    log.info("--- BANCO DE DADOS LIMPO COM SUCESSO ---");
                } catch (Exception e) {
                    log.error("FALHA AO LIMPAR BANCO: " + e.getMessage());
                    // Não engolimos a exceção crítica aqui para saber se falhou de verdade
                    throw new RuntimeException("Erro crítico ao limpar banco de dados", e);
                }
            });

            // 2. POPULAÇÃO (Garante transação para os inserts)
            tx.executeWithoutResult(status -> {
                log.info("--- INICIANDO POPULAÇÃO DE DADOS ---");

                String senhaPadrao = passwordEncoder.encode("admin123");
                String senhaSuper = passwordEncoder.encode(superAdminPassword);

                // --- CRIAR USUÁRIOS ---
                Usuario superAdmin = Usuario.builder().nomeCompleto(superAdminName).email(superAdminEmail).password(senhaSuper).identificacao("99999999999").cargo("CEO").role("ROLE_SUPER_ADMIN").ativo(true).build();
                Usuario adminCentro = Usuario.builder().nomeCompleto("Admin Benfica").email("admin@benfica.com").password(senhaPadrao).identificacao("00000000001").cargo("Gerente").role("ROLE_ADMIN").ativo(true).build();
                Usuario funcBairro = Usuario.builder().nomeCompleto("Func Silva").email("func@benfica.com").password(senhaPadrao).identificacao("11122233344").cargo("Balconista").role("ROLE_USER").ativo(true).build();

                usuarioRepository.saveAll(List.of(superAdmin, adminCentro, funcBairro));

                // --- CRIAR EQUIPES ---
                Equipe equipeCentro = Equipe.builder().nome("Farmácia Benfica - Centro").descricao("Matriz").administrador(adminCentro).ativa(true).build();
                Equipe equipeBairro = Equipe.builder().nome("Drogaria Silva - Bairro").descricao("Filial").administrador(funcBairro).ativa(true).build();

                equipeRepository.saveAll(List.of(equipeCentro, equipeBairro));

                // --- VINCULAR ---
                adminCentro.setEquipe(equipeCentro);
                funcBairro.setEquipe(equipeBairro);
                usuarioRepository.saveAll(List.of(adminCentro, funcBairro));

                // --- DADOS BASE ---
                Cliente cJoao = Cliente.builder().equipe(equipeCentro).nome("João da Silva").cpf("111.111.111-11").email("joao@email.com").telefone("(32) 99999-1111").build();
                Cliente cMaria = Cliente.builder().equipe(equipeCentro).nome("Maria Oliveira").cpf("222.222.222-22").email("maria@email.com").telefone("(32) 99999-2222").codigoInterno("CLI-002").build();
                Cliente cPedro = Cliente.builder().equipe(equipeCentro).nome("Pedro Atrasado").cpf("333.333.333-33").email("pedro@email.com").telefone("(32) 99999-3333").build();
                clienteRepository.saveAll(List.of(cJoao, cMaria, cPedro));

                Fornecedor fSantaCruz = Fornecedor.builder().equipe(equipeCentro).nome("Santa Cruz").telefone("0800 111 222").build();
                Fornecedor fPanpharma = Fornecedor.builder().equipe(equipeCentro).nome("Panpharma").telefone("0800 333 444").build();
                fornecedorRepository.saveAll(List.of(fSantaCruz, fPanpharma));

                Produto pDipirona = Produto.builder().equipe(equipeCentro).nome("Dipirona 500mg").codigo("789111").precoBase(new BigDecimal("4.50")).build();
                Produto pTorsilax = Produto.builder().equipe(equipeCentro).nome("Torsilax 30cp").codigo("789222").precoBase(new BigDecimal("18.90")).build();
                Produto pVitamina = Produto.builder().equipe(equipeCentro).nome("Vitamina C 1g").codigo("789333").precoBase(new BigDecimal("22.00")).build();
                produtoRepository.saveAll(List.of(pDipirona, pTorsilax, pVitamina));

                // --- ENCOMENDAS ---
                criarEncomenda(encomendaRepository, encomendaItemRepository, equipeCentro, cJoao, "Encomenda Criada", LocalDateTime.now().plusDays(2), BigDecimal.ZERO, "Pagar na retirada", false, false, pDipirona, fSantaCruz, 2, new BigDecimal("4.50"));
                criarEncomenda(encomendaRepository, encomendaItemRepository, equipeCentro, cMaria, "Mercadoria em Loja", LocalDateTime.now().plusDays(1), new BigDecimal("10.00"), "Cliente avisada", false, false, pTorsilax, fPanpharma, 1, new BigDecimal("18.90"));
                criarEncomenda(encomendaRepository, encomendaItemRepository, equipeCentro, cJoao, "Aguardando Entrega", LocalDateTime.now().plusHours(4), new BigDecimal("50.00"), "Motoboy saiu", true, false, pVitamina, fSantaCruz, 2, new BigDecimal("22.00"));
                criarEncomenda(encomendaRepository, encomendaItemRepository, equipeCentro, cMaria, "Concluído", LocalDateTime.now().minusDays(5), BigDecimal.ZERO, "Entregue", false, false, pDipirona, fPanpharma, 5, new BigDecimal("4.00"));
                criarEncomenda(encomendaRepository, encomendaItemRepository, equipeCentro, cPedro, "Cancelado", LocalDateTime.now().plusDays(10), BigDecimal.ZERO, "Desistência", false, false, pTorsilax, fSantaCruz, 1, new BigDecimal("18.90"));

                // Atrasadas
                criarEncomenda(encomendaRepository, encomendaItemRepository, equipeCentro, cPedro, "Encomenda Criada", LocalDateTime.now().minusDays(2), BigDecimal.ZERO, "URGENTE ATRASADA", false, true, pVitamina, fPanpharma, 1, new BigDecimal("22.00"));
                criarEncomenda(encomendaRepository, encomendaItemRepository, equipeCentro, cMaria, "Mercadoria em Loja", LocalDateTime.now().minusHours(5), new BigDecimal("5.00"), "Esqueceram de dar baixa", false, false, pDipirona, fSantaCruz, 10, new BigDecimal("4.20"));

                log.info("--- POPULAÇÃO CONCLUÍDA ---");
            });
        };
    }

    private void criarEncomenda(EncomendaRepository encomendaRepo, EncomendaItemRepository itemRepo, Equipe equipe, Cliente cliente, String status, LocalDateTime dataEstimada, BigDecimal adiantamento, String obs, boolean notaFutura, boolean estoqueNegativo, Produto produto, Fornecedor fornecedor, int quantidade, BigDecimal precoCotado) {
        BigDecimal subtotal = precoCotado.multiply(new BigDecimal(quantidade));

        Encomenda enc = Encomenda.builder()
                .equipe(equipe).cliente(cliente).status(status)
                .dataCriacao(LocalDateTime.now())
                .dataEstimadaEntrega(dataEstimada)
                .valorAdiantamento(adiantamento).valorTotal(subtotal)
                .observacoes(obs).notaFutura(notaFutura).vendaEstoqueNegativo(estoqueNegativo)
                .enderecoCep("36000-000").enderecoBairro("Centro").enderecoRua("Rua Halfeld").enderecoNumero("100")
                .build();

        // Garante a lista para evitar NullPointer no listener de histórico (se houver)
        if (enc.getHistorico() == null) {
            enc.setHistorico(java.util.Collections.emptyList());
        }

        enc = encomendaRepo.save(enc);

        EncomendaItem item = EncomendaItem.builder()
                .encomenda(enc).produto(produto).fornecedor(fornecedor)
                .quantidade(quantidade).precoCotado(precoCotado).subtotal(subtotal)
                .build();
        itemRepo.save(item);

        enc.setItens(List.of(item));
        encomendaRepo.save(enc);
    }
}