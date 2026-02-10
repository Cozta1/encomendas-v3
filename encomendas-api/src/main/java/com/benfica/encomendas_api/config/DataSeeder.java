package com.benfica.encomendas_api.seeder;

import com.benfica.encomendas_api.model.*;
import com.benfica.encomendas_api.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

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
            MembroEquipeRepository membroEquipeRepository,
            EscalaTrabalhoRepository escalaRepository,
            ChecklistBoardRepository boardRepository,
            ChecklistCardRepository cardRepository,
            ChecklistItemRepository itemRepository,
            PasswordEncoder passwordEncoder) {

        return args -> {
            // Limpa o banco para garantir testes limpos (Opcional, cuidado em prod!)
            // itemRepository.deleteAll();
            // cardRepository.deleteAll();
            // boardRepository.deleteAll();
            // escalaRepository.deleteAll();
            // membroEquipeRepository.deleteAll();
            // equipeRepository.deleteAll();
            // usuarioRepository.deleteAll();

            System.out.println(">>> INICIANDO DATA SEEDER <<<");

            if (usuarioRepository.findByEmail("admin@benfica.com").isPresent()) {
                System.out.println(">>> Dados já existem. Pulando Seeder.");
                return;
            }

            // 1. CRIAR USUÁRIOS
            Usuario admin = criarUsuario(usuarioRepository, passwordEncoder, "Admin Benfica", "admin@benfica.com", "123456", Role.ROLE_ADMIN);
            Usuario joao = criarUsuario(usuarioRepository, passwordEncoder, "João Silva", "joao@benfica.com", "123456", Role.ROLE_USER);
            Usuario maria = criarUsuario(usuarioRepository, passwordEncoder, "Maria Souza", "maria@benfica.com", "123456", Role.ROLE_USER);

            // 2. CRIAR EQUIPE ÚNICA
            Equipe equipe = new Equipe();
            equipe.setNome("Drogaria Benfica - Matriz");
            equipe.setDono(admin);
            equipeRepository.save(equipe);

            // 3. VINCULAR MEMBROS À EQUIPE
            vincularMembro(membroEquipeRepository, equipe, admin, Role.ROLE_ADMIN);
            vincularMembro(membroEquipeRepository, equipe, joao, Role.ROLE_USER);
            vincularMembro(membroEquipeRepository, equipe, maria, Role.ROLE_USER);

            // 4. CRIAR ESCALAS (Para o mês atual e próximo)
            LocalDate hoje = LocalDate.now();
            LocalDate inicioMes = hoje.withDayOfMonth(1);
            LocalDate fimMes = hoje.plusMonths(1).withDayOfMonth(1).minusDays(1); // Até o fim do mês que vem

            // João: Seg a Sex (08:00 - 18:00)
            criarEscalaMensal(escalaRepository, joao, inicioMes, fimMes, List.of(1, 2, 3, 4, 5), LocalTime.of(8, 0), LocalTime.of(18, 0));

            // Maria: Ter a Sáb (10:00 - 20:00)
            criarEscalaMensal(escalaRepository, maria, inicioMes, fimMes, List.of(2, 3, 4, 5, 6), LocalTime.of(10, 0), LocalTime.of(20, 0));

            System.out.println(">>> Escalas criadas para João e Maria.");

            // 5. CRIAR CHECKLISTS (Estrutura Trello)

            // --- Checklist GERAL (Para todos) ---
            ChecklistBoard boardGeral = criarBoard(boardRepository, equipe, "Rotina Diária - Loja", null); // null = Todos

            ChecklistCard cardAbertura = criarCard(cardRepository, boardGeral, "Abertura da Loja", "Procedimentos essenciais antes de abrir.", LocalTime.of(7, 30), LocalTime.of(8, 0));
            criarItem(itemRepository, cardAbertura, "Desligar alarme", 1);
            criarItem(itemRepository, cardAbertura, "Contar fundo de caixa", 2);
            criarItem(itemRepository, cardAbertura, "Ligar computadores", 3);

            ChecklistCard cardLimpeza = criarCard(cardRepository, boardGeral, "Limpeza e Organização", "Manter a loja impecável.", LocalTime.of(8, 0), LocalTime.of(18, 0));
            criarItem(itemRepository, cardLimpeza, "Verificar validade dos produtos na gôndola", 1);
            criarItem(itemRepository, cardLimpeza, "Limpar chão do corredor principal", 2);

            // --- Checklist INDIVIDUAL (Só para o João) ---
            ChecklistBoard boardJoao = criarBoard(boardRepository, equipe, "Metas do João", joao);
            ChecklistCard cardEstoque = criarCard(cardRepository, boardJoao, "Contagem de Estoque", "Focar na seção de dermocosméticos.", LocalTime.of(14, 0), LocalTime.of(16, 0));
            criarItem(itemRepository, cardEstoque, "Contar Protetores Solares", 1);
            criarItem(itemRepository, cardEstoque, "Contar Hidratantes", 2);

            // --- Checklist INDIVIDUAL (Só para a Maria) ---
            ChecklistBoard boardMaria = criarBoard(boardRepository, equipe, "Tarefas da Maria", maria);
            ChecklistCard cardBalcao = criarCard(cardRepository, boardMaria, "Atendimento Balcão", "Foco em vendas agregadas.", LocalTime.of(10, 0), LocalTime.of(19, 0));
            criarItem(itemRepository, cardBalcao, "Organizar receitas controladas", 1);
            criarItem(itemRepository, cardBalcao, "Repor sacolas", 2);

            System.out.println(">>> Checklists criados (Geral e Individuais).");
            System.out.println(">>> SEEDER CONCLUÍDO COM SUCESSO! <<<");
        };
    }

    // --- MÉTODOS AUXILIARES ---

    private Usuario criarUsuario(UsuarioRepository repo, PasswordEncoder encoder, String nome, String email, String senha, Role role) {
        Usuario u = new Usuario();
        u.setNomeCompleto(nome);
        u.setEmail(email);
        u.setPassword(encoder.encode(senha));
        u.setRole(role);
        return repo.save(u);
    }

    private void vincularMembro(MembroEquipeRepository repo, Equipe equipe, Usuario usuario, Role role) {
        MembroEquipe m = new MembroEquipe();
        m.setEquipe(equipe);
        m.setUsuario(usuario);
        m.setRole(role);
        repo.save(m);
    }

    private void criarEscalaMensal(EscalaTrabalhoRepository repo, Usuario usuario, LocalDate inicio, LocalDate fim, List<Integer> diasSemana, LocalTime entrada, LocalTime saida) {
        LocalDate data = inicio;
        List<EscalaTrabalho> escalas = new ArrayList<>();

        while (!data.isAfter(fim)) {
            // DayOfWeek: 1 (Segunda) a 7 (Domingo)
            if (diasSemana.contains(data.getDayOfWeek().getValue())) {
                EscalaTrabalho e = new EscalaTrabalho();
                e.setUsuario(usuario);
                e.setData(data);
                e.setTipo(TipoEscala.TRABALHO);
                e.setHorarioInicio(entrada);
                e.setHorarioFim(saida);
                e.setObservacao("Turno Padrão");
                escalas.add(e);
            } else {
                // Cria folga nos outros dias (opcional, mas bom para visualização completa)
                EscalaTrabalho e = new EscalaTrabalho();
                e.setUsuario(usuario);
                e.setData(data);
                e.setTipo(TipoEscala.FOLGA);
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
        board.setUsuarioEspecifico(usuarioEspecifico); // null se for geral
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