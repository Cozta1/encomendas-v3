import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { catchError, finalize, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

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

  escalaHoje: EscalaTrabalho | null = null;
  tipoEscalaEnum = TipoEscala;

  constructor(
    private checklistService: ChecklistService,
    private teamService: TeamService,
    private authService: AuthService,
    private escalaService: EscalaService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarDados();
  }

  get isHoje(): boolean {
    const hoje = new Date();
    return this.dataAtual.toDateString() === hoje.toDateString();
  }

  get somenteLeitura(): boolean {
    return !this.isHoje;
  }

  // Returns list of all card-list IDs so each list can connect to the others
  get cardListIds(): string[] {
    return this.boards.map(b => 'cards-' + b.id);
  }

  diaAnterior(): void {
    const d = new Date(this.dataAtual);
    d.setDate(d.getDate() - 1);
    this.dataAtual = d;
    this.carregarDados();
  }

  proximoDia(): void {
    const d = new Date(this.dataAtual);
    d.setDate(d.getDate() + 1);
    this.dataAtual = d;
    this.carregarDados();
  }

  irParaHoje(): void {
    this.dataAtual = new Date();
    this.carregarDados();
  }

  carregarDados(): void {
    const equipeId = this.teamService.getEquipeAtivaId();
    const user = this.authService.getUser();

    if (!equipeId || !user) return;

    this.loading = true;
    const dataStr = this.formatDate(this.dataAtual);

    this.escalaService.getEscalas(user.id, dataStr, dataStr)
      .pipe(
        catchError(err => {
          console.error('Erro ao verificar escala', err);
          return of<EscalaTrabalho[]>([]);
        }),
        switchMap(escalas => {
          this.escalaHoje = escalas.length > 0 ? escalas[0] : null;

          if (this.escalaHoje && this.escalaHoje.tipo !== TipoEscala.TRABALHO) {
            this.boards = [];
            return of<ChecklistBoard[]>([]);
          }

          return this.checklistService.getChecklistDoDia(equipeId, dataStr, user.id).pipe(
            catchError(err => {
              console.error('Erro ao carregar checklists', err);
              return of<ChecklistBoard[]>([]);
            })
          );
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe(boards => {
        this.boards = boards.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
        this.boards.forEach(b => {
          if (b.cards) b.cards.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
        });
      });
  }

  // --- DRAG & DROP ---

  dropBoard(event: CdkDragDrop<ChecklistBoard[]>) {
    if (event.previousIndex === event.currentIndex) return;

    moveItemInArray(this.boards, event.previousIndex, event.currentIndex);
    this.boards.forEach((board, index) => { board.ordem = index; });

    this.checklistService.reordenarBoards(this.boards).subscribe({
      error: () => this.snackBar.open('Erro ao salvar ordem. Recarregue a página.', 'Fechar', { duration: 4000 })
    });
  }

  dropCard(event: CdkDragDrop<ChecklistCard[]>) {
    if (event.previousContainer === event.container) {
      // Reorder within same board
      if (event.previousIndex === event.currentIndex) return;

      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      event.container.data.forEach((card, index) => { card.ordem = index; });

      this.checklistService.reordenarCards(event.container.data).subscribe({
        error: () => this.snackBar.open('Erro ao salvar ordem. Recarregue a página.', 'Fechar', { duration: 4000 })
      });
    } else {
      // Move card between boards
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      const card = event.container.data[event.currentIndex];

      // Find the target board
      const targetBoard = this.boards.find(b => b.cards === event.container.data);
      if (targetBoard) {
        // Update local ordem
        event.container.data.forEach((c, i) => { c.ordem = i; });
        event.previousContainer.data.forEach((c, i) => { c.ordem = i; });

        // Persist move + reorder
        this.checklistService.moverCard(card.id, targetBoard.id).subscribe({
          error: () => this.snackBar.open('Erro ao mover cartão.', 'Fechar', { duration: 4000 })
        });

        if (event.container.data.length > 1) {
          this.checklistService.reordenarCards(event.container.data).subscribe({
            error: () => {}
          });
        }
        if (event.previousContainer.data.length > 0) {
          this.checklistService.reordenarCards(event.previousContainer.data).subscribe({
            error: () => {}
          });
        }
      }
    }
  }

  abrirCardDetalhado(card: ChecklistCard) {
    const user = this.authService.getUser();
    if (!user) return;

    // Find the board this card belongs to
    const board = this.boards.find(b => b.cards.some(c => c.id === card.id));

    this.dialog.open(ChecklistCardDialog, {
      width: '768px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'trello-dialog-container',
      data: {
        card: card,
        usuarioId: user.id,
        dataReferencia: this.formatDate(this.dataAtual),
        somenteLeitura: this.somenteLeitura || card.status === 'FECHADO',
        boardNome: board?.nome
      },
      disableClose: false
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
