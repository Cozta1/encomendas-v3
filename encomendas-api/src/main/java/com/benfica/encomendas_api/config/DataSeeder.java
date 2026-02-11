package com.benfica.encomendas_api.config;

import com.benfica.encomendas_api.model.*;
import com.benfica.encomendas_api.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner initDatabase(
            UsuarioRepository usuarioRepository,
            EquipeRepository equipeRepository,
            EscalaTrabalhoRepository escalaRepository,
            ChecklistBoardRepository boardRepository,
            ChecklistCardRepository cardRepository,
            ChecklistItemRepository itemRepository,
            PasswordEncoder passwordEncoder,
            PlatformTransactionManager transactionManager) { // <--- 1. Injeção do Gerenciador de Transações

        return args -> {
            System.out.println(">>> INICIANDO DATA SEEDER (CORRIGIDO) <<<");

            // 1. GARANTIR USUÁRIOS
            Usuario admin = garantirUsuario(usuarioRepository, passwordEncoder, "Carlos Admin", "admin@benfica.com", "123456", "ROLE_ADMIN", "Gerente Geral");
            Usuario joao = garantirUsuario(usuarioRepository, passwordEncoder, "João Manhã", "joao@benfica.com", "123456", "ROLE_USER", "Farmacêutico");
            Usuario maria = garantirUsuario(usuarioRepository, passwordEncoder, "Maria Tarde", "maria@benfica.com", "123456", "ROLE_USER", "Atendente");
            Usuario pedro = garantirUsuario(usuarioRepository, passwordEncoder, "Pedro Noite", "pedro@benfica.com", "123456", "ROLE_USER", "Caixa");

            // 2. GARANTIR EQUIPE
            Equipe equipe = equipeRepository.findByNome("Drogaria Benfica - Matriz")
                    .orElseGet(() -> {
                        Equipe nova = new Equipe();
                        nova.setNome("Drogaria Benfica - Matriz");
                        nova.setDescricao("Loja Principal - Centro");
                        nova.setAdministrador(admin);
                        return equipeRepository.save(nova);
                    });

            // 3. ATUALIZAR MEMBROS (COM TRANSAÇÃO EXPLÍCITA)
            // Usamos TransactionTemplate para garantir que a sessão esteja aberta ao acessar 'getMembros'
            TransactionTemplate tm = new TransactionTemplate(transactionManager);
            tm.execute(status -> {
                atualizarMembrosEquipe(equipeRepository, usuarioRepository, equipe, List.of(admin, joao, maria, pedro));
                return null;
            });

            System.out.println(">>> Equipe e Membros sincronizados.");

            // 4. CRIAR ESCALAS
            if (escalaRepository.count() == 0) {
                LocalDate hoje = LocalDate.now();
                LocalDate inicioMes = hoje.withDayOfMonth(1);
                LocalDate fimMes = hoje.plusMonths(1).withDayOfMonth(1).minusDays(1);

                criarEscalaMensal(escalaRepository, joao, inicioMes, fimMes,
                        List.of(DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY),
                        LocalTime.of(7, 0), LocalTime.of(16, 0));

                criarEscalaMensal(escalaRepository, maria, inicioMes, fimMes,
                        List.of(DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY),
                        LocalTime.of(13, 0), LocalTime.of(22, 0));

                criarEscalaMensal(escalaRepository, pedro, inicioMes, fimMes,
                        List.of(DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY, DayOfWeek.SUNDAY),
                        LocalTime.of(16, 0), LocalTime.of(0, 0));

                System.out.println(">>> Escalas criadas.");
            }

            // 5. CRIAR CHECKLISTS
            if (boardRepository.count() == 0) {
                ChecklistBoard boardGeral = criarBoard(boardRepository, equipe, "Rotinas da Loja", null);
                ChecklistCard cardLimpeza = criarCard(cardRepository, boardGeral, "Limpeza e Organização", "Tarefas de manutenção diária.", LocalTime.of(8, 0), LocalTime.of(22, 0));
                criarItem(itemRepository, cardLimpeza, "Verificar lixeiras", 1);
                criarItem(itemRepository, cardLimpeza, "Repor papel toalha", 2);

                ChecklistBoard boardJoao = criarBoard(boardRepository, equipe, "Tarefas do João", joao);
                criarCard(cardRepository, boardJoao, "Abertura", "Rotina matinal", LocalTime.of(7, 0), LocalTime.of(8, 0));

                ChecklistBoard boardAdmin = criarBoard(boardRepository, equipe, "Gerência (Carlos)", admin);
                criarCard(cardRepository, boardAdmin, "Relatórios", "Análise diária", LocalTime.of(9, 0), LocalTime.of(18, 0));

                System.out.println(">>> Checklists criados.");
            }

            System.out.println(">>> SEEDER CONCLUÍDO COM SUCESSO! <<<");
        };
    }

    // --- MÉTODOS AUXILIARES ---

    private Usuario garantirUsuario(UsuarioRepository repo, PasswordEncoder encoder, String nome, String email, String senha, String role, String cargo) {
        return repo.findByEmail(email).orElseGet(() -> {
            Usuario u = new Usuario();
            u.setNomeCompleto(nome);
            u.setEmail(email);
            u.setPassword(encoder.encode(senha));
            u.setRole(role);
            u.setCargo(cargo);
            u.setIdentificacao(email.split("@")[0].toUpperCase());
            return repo.save(u);
        });
    }

    // Removemos @Transactional daqui pois não surte efeito em método privado
    private void atualizarMembrosEquipe(EquipeRepository equipeRepo, UsuarioRepository userRepo, Equipe equipe, List<Usuario> membros) {
        // 1. Atualiza o lado do Usuario (ManyToOne)
        for (Usuario u : membros) {
            if (u.getEquipe() == null || !u.getEquipe().getId().equals(equipe.getId())) {
                u.setEquipe(equipe);
                userRepo.save(u);
            }
        }

        // 2. Atualiza o lado da Equipe (Lazy collection)
        // Como estamos dentro do tm.execute(), a sessão está aberta
        Equipe equipeAtualizada = equipeRepo.findById(equipe.getId()).orElse(equipe);

        boolean alterou = false;
        for (Usuario u : membros) {
            // Aqui ocorria o erro: acesso à lista Lazy sem transação
            boolean jaEstaNaLista = equipeAtualizada.getMembros().stream().anyMatch(m -> m.getId().equals(u.getId()));
            if (!jaEstaNaLista) {
                equipeAtualizada.getMembros().add(u);
                alterou = true;
            }
        }

        if (alterou) {
            equipeRepo.save(equipeAtualizada);
        }
    }

    private void criarEscalaMensal(EscalaTrabalhoRepository repo, Usuario usuario, LocalDate inicio, LocalDate fim, List<DayOfWeek> diasSemana, LocalTime entrada, LocalTime saida) {
        // Lógica de escala mantida
        LocalDate data = inicio;
        List<EscalaTrabalho> escalas = new ArrayList<>();
        while (!data.isAfter(fim)) {
            if (diasSemana.contains(data.getDayOfWeek())) {
                EscalaTrabalho e = new EscalaTrabalho();
                e.setUsuario(usuario);
                e.setData(data);
                e.setTipo(TipoEscala.TRABALHO);
                e.setHorarioInicio(entrada);
                e.setHorarioFim(saida);
                e.setObservacao("Turno Regular");
                escalas.add(e);
            }
            data = data.plusDays(1);
        }
        repo.saveAll(escalas);
    }

    private ChecklistBoard criarBoard(ChecklistBoardRepository repo, Equipe equipe, String nome, Usuario usuarioEspecifico) {
        ChecklistBoard board = new ChecklistBoard();
        board.setNome(nome);
        board.setEquipe(equipe);
        board.setUsuarioEspecifico(usuarioEspecifico);
        return repo.save(board);
    }

    private ChecklistCard criarCard(ChecklistCardRepository repo, ChecklistBoard board, String titulo, String descricao, LocalTime inicio, LocalTime fim) {
        ChecklistCard card = new ChecklistCard();
        card.setBoard(board);
        card.setTitulo(titulo);
        card.setDescricao(descricao);
        card.setHorarioAbertura(inicio);
        card.setHorarioFechamento(fim);
        return repo.save(card);
    }

    private void criarItem(ChecklistItemRepository repo, ChecklistCard card, String descricao, int ordem) {
        ChecklistItem item = new ChecklistItem();
        item.setCard(card);
        item.setDescricao(descricao);
        item.setOrdem(ordem);
        repo.save(item);
    }
}