import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { finalize } from 'rxjs/operators';

import { ChecklistService } from '../../core/services/checklist.service';
import { TeamService } from '../../core/team/team.service';
import { AuthService } from '../../core/auth/auth.service';
import { ChecklistBoard, ChecklistCard } from '../../core/models/checklist.interfaces';
import { ChecklistCardDialog } from '../../components/dialogs/checklist-card-dialog/checklist-card-dialog';
import { EscalaService } from '../../core/services/escala.service';
import { EscalaTrabalho, TipoEscala } from '../../core/models/escala.interfaces';

@Component({
  selector: 'app-checklist-dia',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressBarModule,
    MatDialogModule,
    MatTooltipModule,
    MatSnackBarModule,
    DragDropModule
  ],
  templateUrl: './checklist-dia.html',
  styleUrls: ['./checklist-dia.scss']
})
export class ChecklistDiaComponent implements OnInit {

  boards: ChecklistBoard[] = [];
  loading = false;
  dataAtual = new Date();
  private dadosCarregados = false;

  escalaHoje: EscalaTrabalho | null = null;
  tipoEscalaEnum = TipoEscala;

  constructor(
    private checklistService: ChecklistService,
    private teamService: TeamService,
    private authService: AuthService,
    private escalaService: EscalaService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.carregarDadosIniciais();
  }

  // Carrega apenas na inicialização. Não deve ser chamado após fechar Modais.
  carregarDadosIniciais() {
    if (this.dadosCarregados) return;

    const equipeId = this.teamService.getEquipeAtivaId();
    const user = this.authService.getUser();

    if (!equipeId || !user) return;

    this.loading = true;
    const hojeStr = this.formatDate(this.dataAtual);

    this.escalaService.getEscalas(user.id, hojeStr, hojeStr).subscribe({
      next: (escalas) => {
        this.escalaHoje = escalas.length > 0 ? escalas[0] : null;

        if (this.escalaHoje && this.escalaHoje.tipo !== TipoEscala.TRABALHO) {
          this.loading = false;
          this.boards = [];
        } else {
          this.buscarChecklists(equipeId, hojeStr, user.id);
        }
      },
      error: (err) => {
        console.error('Erro escala', err);
        this.buscarChecklists(equipeId, hojeStr, user.id);
      }
    });
  }

  private buscarChecklists(equipeId: string, data: string, userId: number) {
    this.checklistService.getChecklistDoDia(equipeId, data, userId)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (dados) => {
          // Ordenação inicial vinda do backend
          this.boards = dados.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
          this.boards.forEach(b => {
            if(b.cards) b.cards.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
          });
          this.dadosCarregados = true;
        },
        error: (err) => console.error(err)
      });
  }

  // --- DRAG & DROP OTIMIZADO ---

  dropBoard(event: CdkDragDrop<ChecklistBoard[]>) {
    if (event.previousIndex === event.currentIndex) return;

    // 1. Atualiza o array visualmente
    moveItemInArray(this.boards, event.previousIndex, event.currentIndex);

    // 2. CRUCIAL: Atualiza a propriedade 'ordem' dos objetos locais para refletir a nova posição do array
    // Isso garante que se o usuário mover outro item em seguida, o estado local esteja correto.
    this.boards.forEach((board, index) => {
      board.ordem = index;
    });

    // 3. Envia para o backend
    this.checklistService.reordenarBoards(this.boards).subscribe({
      error: () => this.snackBar.open('Erro ao salvar ordem. Recarregue a página.', 'Fechar', { duration: 4000 })
    });
  }

  dropCard(event: CdkDragDrop<ChecklistCard[]>) {
    if (event.previousContainer === event.container) {
      if (event.previousIndex === event.currentIndex) return;

      // 1. Atualiza visualmente
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);

      // 2. Atualiza modelo local
      event.container.data.forEach((card, index) => {
        card.ordem = index;
      });

      // 3. Persiste
      this.checklistService.reordenarCards(event.container.data).subscribe({
        error: () => this.snackBar.open('Erro ao salvar ordem. Recarregue a página.', 'Fechar', { duration: 4000 })
      });
    } else {
      // Caso queira implementar mover entre colunas no futuro
      // transferArrayItem(...)
    }
  }

  abrirCardDetalhado(card: ChecklistCard) {
    const user = this.authService.getUser();
    if (!user) return;

    // Abrimos o modal passando o objeto 'card' por referência.
    // Qualquer alteração feita lá dentro (marcar checkbox) reflete aqui imediatamente.
    const dialogRef = this.dialog.open(ChecklistCardDialog, {
      width: '768px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'trello-dialog-container',
      data: { card: card, usuarioId: user.id },
      disableClose: false // Permite clicar fora pra fechar
    });

    // PERFORMANCE: NÃO recarregamos a página inteira ao fechar.
    // O Angular detecta mudanças nos objetos e atualiza a view (barras de progresso, etc).
    dialogRef.afterClosed().subscribe(() => {
       // Apenas lógica local se necessário, mas NUNCA this.carregarDadosIniciais()
       // a menos que seja uma mudança estrutural crítica (ex: deletar card)
    });
  }

  // --- Helpers ---
  countMarcados(card: ChecklistCard): number {
    return card.itens ? card.itens.filter(i => i.marcado).length : 0;
  }

  getProgresso(card: ChecklistCard): number {
    if (!card.itens || card.itens.length === 0) return 0;
    return (this.countMarcados(card) / card.itens.length) * 100;
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
