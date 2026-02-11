import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
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
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.carregarDadosIniciais();
  }

  // Renomeado para indicar que é carregamento completo
  carregarDadosIniciais() {
    const equipeId = this.teamService.getEquipeAtivaId();
    const user = this.authService.getUser();

    if (!equipeId || !user) return;

    this.loading = true; // Só ativa o loading aqui
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
          // O backend deve retornar os dados ordenados por 'ordem' ASC
          this.boards = dados.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
          this.boards.forEach(b => {
            if(b.cards) b.cards.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
          });
        },
        error: (err) => console.error(err)
      });
  }

  // --- DRAG & DROP OTIMIZADO ---

  dropBoard(event: CdkDragDrop<ChecklistBoard[]>) {
    // 1. Atualiza visualmente instantaneamente
    moveItemInArray(this.boards, event.previousIndex, event.currentIndex);

    // 2. Envia para o backend silenciosamente (sem loading screen)
    this.checklistService.reordenarBoards(this.boards).subscribe({
      error: () => console.error('Erro ao salvar ordem dos boards')
    });
  }

  dropCard(event: CdkDragDrop<ChecklistCard[]>) {
    if (event.previousContainer === event.container) {
      // 1. Atualiza visualmente
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);

      // 2. Envia para o backend silenciosamente
      this.checklistService.reordenarCards(event.container.data).subscribe({
        error: () => console.error('Erro ao salvar ordem dos cards')
      });
    }
  }

  abrirCardDetalhado(card: ChecklistCard) {
    const user = this.authService.getUser();
    if (!user) return;

    const dialogRef = this.dialog.open(ChecklistCardDialog, {
      width: '768px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'trello-dialog-container',
      data: { card: card, usuarioId: user.id } // Passamos o objeto por referência
    });

    // CORREÇÃO DE PERFORMANCE:
    // Removemos o 'this.carregarDados()' daqui.
    // Como 'card' é um objeto, as alterações feitas no Dialog (marcar checkbox)
    // refletem automaticamente na tela de fundo devido à referência de memória do JS.
    dialogRef.afterClosed().subscribe(() => {
      // Apenas forçamos o Angular a verificar mudanças visuais se necessário,
      // mas sem recarregar tudo do servidor.
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
