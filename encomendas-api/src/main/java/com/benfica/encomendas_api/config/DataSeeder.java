package com.benfica.encomendas_api.config;

import com.benfica.encomendas_api.model.*;
import com.benfica.encomendas_api.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
            // 1. LIMPAR O BANCO DE DADOS
            log.info("--- LIMPANDO BANCO DE DADOS (PERFIL DEV) ---");

            // Ordem importa: apagar filhos antes dos pais
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

            usuarioRepository.saveAll(List.of(adminUser, funcUser));
            log.info("Criados {} usuários.", usuarioRepository.count());

            // 3. CRIAR EQUIPES (FARMÁCIAS)
            log.info("--- CRIANDO EQUIPES PADRÃO ---");
            Equipe equipeCentro = Equipe.builder()
                    .nome("Farmácia Benfica - Centro")
                    .descricao("Filial principal no centro da cidade.")
                    .administrador(adminUser)
                    .ativa(true)
                    .build();

            Equipe equipeBairro = Equipe.builder()
                    .nome("Drogaria Silva - Bairro")
                    .descricao("Filial do bairro, administrada pelo Funcionario Teste.")
                    .administrador(funcUser)
                    .ativa(true)
                    .build();

            equipeRepository.saveAll(List.of(equipeCentro, equipeBairro));
            log.info("Criadas {} equipes.", equipeRepository.count());

            // 4. CRIAR CLIENTES
            Cliente clienteA = Cliente.builder().nome("Cliente A Teste").email("clientea@teste.com").equipe(equipeCentro).build();
            Cliente clienteB = Cliente.builder().nome("Cliente B da Silva").email("clienteb@teste.com").equipe(equipeBairro).build();
            clienteRepository.saveAll(List.of(clienteA, clienteB));
            log.info("Criados {} clientes.", clienteRepository.count());

            // 5. CRIAR FORNECEDORES
            Fornecedor fornA = Fornecedor.builder().nome("Distribuidora MedFarma").cnpj("11.111.111/0001-11").equipe(equipeCentro).build();
            Fornecedor fornB = Fornecedor.builder().nome("Lab Silva").cnpj("22.222.222/0001-22").equipe(equipeBairro).build();
            fornecedorRepository.saveAll(List.of(fornA, fornB));
            log.info("Criados {} fornecedores.", fornecedorRepository.count());

            // 6. CRIAR PRODUTOS
            Produto prodA = Produto.builder().nome("Dipirona 500mg").codigo("78910001").precoBase(new BigDecimal("10.50")).equipe(equipeCentro).build();
            Produto prodB = Produto.builder().nome("Paracetamol 750mg").codigo("78910002").precoBase(new BigDecimal("12.00")).equipe(equipeCentro).build();
            Produto prodC = Produto.builder().nome("Shampoo Anticaspa").codigo("88800011").precoBase(new BigDecimal("25.00")).equipe(equipeBairro).build();
            produtoRepository.saveAll(List.of(prodA, prodB, prodC));
            log.info("Criados {} produtos.", produtoRepository.count());

            // 7. CRIAR ENCOMENDA (ATUALIZADO COM ENDEREÇO)
            Encomenda encomenda1 = Encomenda.builder()
                    .cliente(clienteA)
                    .equipe(equipeCentro)
                    .status("Pendente")
                    // --- NOVOS CAMPOS OBRIGATÓRIOS ---
                    .enderecoCep("36000-000")
                    .enderecoBairro("Centro")
                    .enderecoRua("Av. Rio Branco")
                    .enderecoNumero("100")
                    .enderecoComplemento("Apto 101") // Opcional
                    .valorAdiantamento(new BigDecimal("5.00")) // Opcional
                    // ---------------------------------
                    .valorTotal(new BigDecimal("0.00"))
                    .build();
            encomendaRepository.save(encomenda1);

            // 8. CRIAR ITENS DA ENCOMENDA
            EncomendaItem item1 = EncomendaItem.builder()
                    .encomenda(encomenda1)
                    .produto(prodA)
                    .fornecedor(fornA)
                    .quantidade(2)
                    .precoCotado(new BigDecimal("10.00"))
                    .subtotal(new BigDecimal("20.00"))
                    .build();

            EncomendaItem item2 = EncomendaItem.builder()
                    .encomenda(encomenda1)
                    .produto(prodB)
                    .fornecedor(fornA)
                    .quantidade(1)
                    .precoCotado(new BigDecimal("11.50"))
                    .subtotal(new BigDecimal("11.50"))
                    .build();

            encomendaItemRepository.saveAll(List.of(item1, item2));

            encomenda1.setValorTotal(item1.getSubtotal().add(item2.getSubtotal()));
            encomendaRepository.save(encomenda1);

            log.info("--- BANCO DE DADOS POPULADO COM SUCESSO (PERFIL DEV) ---");
        };
    }
}