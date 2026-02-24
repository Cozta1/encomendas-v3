import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { ChecklistService } from '../../core/services/checklist.service';
import { TeamService } from '../../core/team/team.service';
import { EquipeService, MembroEquipe } from '../../core/services/equipe.service';
import { AuthService } from '../../core/auth/auth.service';
import { ChecklistBoard, ChecklistCard, ChecklistItem, ChecklistRelatorio, RelatorioCard, RelatorioUsuario } from '../../core/models/checklist.interfaces';
import { EnviarNotificacaoDialog } from '../../components/dialogs/enviar-notificacao-dialog/enviar-notificacao-dialog';

@Component({
  selector: 'app-checklist-criador',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatDividerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatChipsModule,
    MatDialogModule
  ],
  templateUrl: './checklist-criador.html',
  styleUrls: ['./checklist-criador.scss']
})
export class ChecklistCriadorComponent implements OnInit {

  boards: ChecklistBoard[] = [];
  membros: MembroEquipe[] = [];
  loading = false;
  equipeId: string | null = null;

  showNovoBoardForm = false;
  novoBoard = { nome: '', usuarioId: null };

  // Inline rename state
  editandoBoardId: string | null = null;
  editandoBoardNome = '';
  editandoCardId: string | null = null;
  editandoCardNome = '';
  editandoCardHoraInicio = '';
  editandoCardHoraFim = '';

  // --- Relatório de Atividades ---
  mostrarRelatorio = false;
  dataRelatorio = new Date();
  relatorio: ChecklistRelatorio | null = null;
  carregandoRelatorio = false;
  filtroStatus: 'TODOS' | 'CONCLUIDA' | 'ABERTA' | 'FECHADA_INCOMPLETA' | 'PENDENTE' = 'TODOS';

  constructor(
    private checklistService: ChecklistService,
    private teamService: TeamService,
    private equipeService: EquipeService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.equipeId = this.teamService.getEquipeAtivaId();
    if (this.equipeId) {
      this.carregarDados();
    }
  }

  carregarDados() {
    this.loading = true;

    forkJoin({
      membros: this.equipeService.listarMembros(),
      boards: this.checklistService.getAllBoards(this.equipeId!)
    }).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: ({ membros, boards }) => {
        this.membros = membros;
        this.boards = boards;
      },
      error: () => this.snackBar.open('Erro ao carregar checklists.', 'Fechar', { duration: 3000 })
    });
  }

  // --- BOARD ---
  criarBoard() {
    if (!this.novoBoard.nome || !this.equipeId) return;

    this.checklistService.criarBoard(this.novoBoard.nome, this.equipeId, this.novoBoard.usuarioId)
      .subscribe({
        next: (board) => {
          this.boards.push(board);
          this.novoBoard = { nome: '', usuarioId: null };
          this.showNovoBoardForm = false;
          this.snackBar.open('Quadro criado com sucesso!', 'OK', { duration: 3000 });
        },
        error: () => this.snackBar.open('Erro ao criar quadro.', 'Fechar', { duration: 3000 })
      });
  }

  iniciarRenomearBoard(board: ChecklistBoard, event: Event) {
    event.stopPropagation();
    this.editandoBoardId = board.id;
    this.editandoBoardNome = board.nome;
  }

  salvarRenomearBoard(board: ChecklistBoard) {
    const novoNome = this.editandoBoardNome.trim();
    if (!novoNome || novoNome === board.nome) {
      this.editandoBoardId = null;
      return;
    }
    this.checklistService.atualizarBoard(board.id, { nome: novoNome }).subscribe({
      next: () => {
        board.nome = novoNome;
        this.editandoBoardId = null;
        this.snackBar.open('Quadro renomeado.', '', { duration: 2000 });
      },
      error: () => this.snackBar.open('Erro ao renomear quadro.', 'Fechar', { duration: 3000 })
    });
  }

  excluirBoard(board: ChecklistBoard, event: Event) {
    event.stopPropagation();
    if (!confirm(`Excluir o quadro "${board.nome}" e todos os seus cartões? Esta ação não pode ser desfeita.`)) return;

    this.checklistService.excluirBoard(board.id).subscribe({
      next: () => {
        this.boards = this.boards.filter(b => b.id !== board.id);
        this.snackBar.open('Quadro excluído.', '', { duration: 2000 });
      },
      error: () => this.snackBar.open('Erro ao excluir quadro.', 'Fechar', { duration: 3000 })
    });
  }

  // --- CARD ---
  adicionarCard(board: ChecklistBoard, titulo: string, inicio: string, fim: string) {
    if (!titulo || !inicio || !fim) return;

    const inicioFmt = inicio.length === 5 ? `${inicio}:00` : inicio;
    const fimFmt = fim.length === 5 ? `${fim}:00` : fim;

    this.checklistService.adicionarCard(board.id, titulo, inicioFmt, fimFmt)
      .subscribe({
        next: (card) => {
          if (!board.cards) board.cards = [];
          board.cards.push(card);
          this.snackBar.open('Cartão adicionado!', 'OK', { duration: 2000 });
        },
        error: () => this.snackBar.open('Erro ao adicionar cartão.', 'Fechar', { duration: 3000 })
      });
  }

  iniciarEditarCard(card: ChecklistCard, event: Event) {
    event.stopPropagation();
    this.editandoCardId = card.id;
    this.editandoCardNome = card.titulo;
    this.editandoCardHoraInicio = card.horarioAbertura ? card.horarioAbertura.substring(0, 5) : '';
    this.editandoCardHoraFim = card.horarioFechamento ? card.horarioFechamento.substring(0, 5) : '';
  }

  salvarEditarCard(card: ChecklistCard) {
    const titulo = this.editandoCardNome.trim();
    const horarioAbertura = this.editandoCardHoraInicio.length === 5 ? `${this.editandoCardHoraInicio}:00` : this.editandoCardHoraInicio;
    const horarioFechamento = this.editandoCardHoraFim.length === 5 ? `${this.editandoCardHoraFim}:00` : this.editandoCardHoraFim;

    if (!titulo) {
      this.editandoCardId = null;
      return;
    }

    this.checklistService.atualizarCard(card.id, { titulo, horarioAbertura, horarioFechamento }).subscribe({
      next: () => {
        card.titulo = titulo;
        card.horarioAbertura = horarioAbertura;
        card.horarioFechamento = horarioFechamento;
        this.editandoCardId = null;
        this.snackBar.open('Cartão atualizado.', '', { duration: 2000 });
      },
      error: () => this.snackBar.open('Erro ao editar cartão.', 'Fechar', { duration: 3000 })
    });
  }

  excluirCard(board: ChecklistBoard, card: ChecklistCard, event: Event) {
    event.stopPropagation();
    if (!confirm(`Excluir o cartão "${card.titulo}" e todos os seus itens?`)) return;

    this.checklistService.excluirCard(card.id).subscribe({
      next: () => {
        board.cards = board.cards.filter(c => c.id !== card.id);
        this.snackBar.open('Cartão excluído.', '', { duration: 2000 });
      },
      error: () => this.snackBar.open('Erro ao excluir cartão.', 'Fechar', { duration: 3000 })
    });
  }

  // --- ITEM ---
  adicionarItem(card: ChecklistCard, descricao: string, inputEl: HTMLInputElement) {
    if (!descricao.trim()) return;

    const ordem = card.itens ? card.itens.length + 1 : 1;

    this.checklistService.adicionarItem(card.id, descricao.trim(), ordem)
      .subscribe({
        next: (item) => {
          if (!card.itens) card.itens = [];
          card.itens.push(item as any);
          inputEl.value = '';
        },
        error: () => this.snackBar.open('Erro ao adicionar item.', 'Fechar', { duration: 3000 })
      });
  }

  excluirItem(card: ChecklistCard, item: any, event: Event) {
    event.stopPropagation();
    if (!confirm(`Excluir o item "${item.descricao}"?`)) return;

    this.checklistService.excluirItem(item.id).subscribe({
      next: () => {
        card.itens = card.itens.filter((i: any) => i.id !== item.id);
        this.snackBar.open('Item excluído.', '', { duration: 2000 });
      },
      error: () => this.snackBar.open('Erro ao excluir item.', 'Fechar', { duration: 3000 })
    });
  }

  // --- HELPERS ---
  getNomeResponsavel(usuarioId: number): string {
    const membro = this.membros.find(m => m.id === usuarioId);
    return membro ? membro.nomeCompleto : 'Desconhecido';
  }

  formatarHorario(horario: any): string {
    if (!horario) return '';
    const str = horario.toString();
    return str.length >= 5 ? str.substring(0, 5) : str;
  }

  // --- RELATÓRIO DE ATIVIDADES ---

  get isHojeRelatorio(): boolean {
    const hoje = new Date();
    return this.dataRelatorio.toDateString() === hoje.toDateString();
  }

  toggleRelatorio() {
    this.mostrarRelatorio = !this.mostrarRelatorio;
    if (this.mostrarRelatorio && !this.relatorio) {
      this.buscarRelatorio();
    }
  }

  diaAnteriorRelatorio() {
    const d = new Date(this.dataRelatorio);
    d.setDate(d.getDate() - 1);
    this.dataRelatorio = d;
    this.relatorio = null;
    this.buscarRelatorio();
  }

  proximoDiaRelatorio() {
    const d = new Date(this.dataRelatorio);
    d.setDate(d.getDate() + 1);
    this.dataRelatorio = d;
    this.relatorio = null;
    this.buscarRelatorio();
  }

  irParaHojeRelatorio() {
    this.dataRelatorio = new Date();
    this.relatorio = null;
    this.buscarRelatorio();
  }

  buscarRelatorio() {
    if (!this.equipeId) return;

    this.carregandoRelatorio = true;
    this.relatorio = null;
    this.filtroStatus = 'TODOS';

    const dataStr = this.formatDate(this.dataRelatorio);

    this.checklistService.getRelatorio(this.equipeId, dataStr).pipe(
      catchError(() => {
        this.snackBar.open('Erro ao carregar relatório.', 'Fechar', { duration: 3000 });
        return of(null);
      }),
      finalize(() => this.carregandoRelatorio = false)
    ).subscribe(relatorio => {
      this.relatorio = relatorio;
    });
  }

  // --- FILTROS DO RELATÓRIO ---

  filtrarCards(cards: RelatorioCard[]): RelatorioCard[] {
    if (this.filtroStatus === 'TODOS') return cards;
    return cards.filter(c => c.statusCard === this.filtroStatus);
  }

  contarCardsPorStatus(status: string): number {
    if (!this.relatorio) return 0;
    let total = 0;
    for (const usuario of this.relatorio.usuarios) {
      for (const board of usuario.boards) {
        for (const card of board.cards) {
          if (card.statusCard === status) total++;
        }
      }
    }
    return total;
  }

  contarCardsPorStatusDoUsuario(usuario: RelatorioUsuario, status: string): number {
    return usuario.boards.reduce((acc, board) =>
      acc + board.cards.filter(c => c.statusCard === status).length, 0);
  }

  getLabelProgresso(usuario: RelatorioUsuario): string {
    switch (this.filtroStatus) {
      case 'CONCLUIDA':
        return `${this.contarCardsPorStatusDoUsuario(usuario, 'CONCLUIDA')} concluída(s)`;
      case 'ABERTA':
        return `${this.contarCardsPorStatusDoUsuario(usuario, 'ABERTA')} aberta(s)`;
      case 'FECHADA_INCOMPLETA':
        return `${this.contarCardsPorStatusDoUsuario(usuario, 'FECHADA_INCOMPLETA')} fechada(s) incompleta(s)`;
      case 'PENDENTE':
        return `${this.contarCardsPorStatusDoUsuario(usuario, 'PENDENTE')} pendente(s)`;
      default:
        return `${usuario.totalMarcados}/${usuario.totalItens} itens concluídos`;
    }
  }

  getLabelStatus(status?: string): string {
    const labels: Record<string, string> = {
      CONCLUIDA: 'Concluída',
      ABERTA: 'Aberta',
      FECHADA_INCOMPLETA: 'Fechada Incompleta',
      PENDENTE: 'Pendente',
      SEM_ITENS: 'Sem itens'
    };
    return labels[status ?? ''] ?? '';
  }

  // --- NOTIFICAÇÕES (Admin) ---

  abrirDialogNotificacao() {
    const user = this.authService.getUser();
    if (!user || !this.equipeId) return;

    this.dialog.open(EnviarNotificacaoDialog, {
      data: {
        equipeId: this.equipeId,
        remetenteId: user.id,
        membros: this.membros
      },
      width: '480px'
    });
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
