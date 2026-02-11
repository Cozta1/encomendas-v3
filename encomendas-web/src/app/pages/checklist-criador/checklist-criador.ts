import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Necessário para [(ngModel)]
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

import { ChecklistService } from '../../core/services/checklist.service';
import { TeamService } from '../../core/team/team.service';
import { EquipeService, MembroEquipe } from '../../core/services/equipe.service';
import { ChecklistBoard } from '../../core/models/checklist.interfaces';

@Component({
  selector: 'app-checklist-criador',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule, // CRITICO: Corrige o erro NG8002 (Can't bind to ngModel)
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatDividerModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './checklist-criador.html',
  styleUrls: ['./checklist-criador.scss']
})
export class ChecklistCriadorComponent implements OnInit {

  boards: ChecklistBoard[] = [];
  membros: MembroEquipe[] = [];
  loading = false;
  equipeId: string | null = null;

  // Objeto para o formulário de criação (Corrige erro TS2339 'novoBoard')
  showNovoBoardForm = false;
  novoBoard = { nome: '', usuarioId: null };

  constructor(
    private checklistService: ChecklistService,
    private teamService: TeamService,
    private equipeService: EquipeService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.equipeId = this.teamService.getEquipeAtivaId();
    if (this.equipeId) {
      this.carregarDados();
    }
  }

  carregarDados() {
    this.loading = true;

    // 1. Carrega Membros
    this.equipeService.listarMembros().subscribe({
      next: (membros) => this.membros = membros,
      error: (err) => console.error('Erro ao carregar membros', err)
    });

    // 2. Carrega Boards
    this.checklistService.getAllBoards(this.equipeId!).subscribe({
      next: (boards) => {
        this.boards = boards;
        this.loading = false;
      },
      error: (err) => {
        this.snackBar.open('Erro ao carregar checklists.', 'Fechar', { duration: 3000 });
        this.loading = false;
      }
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

  // --- CARD (Corrige erro TS2339 'adicionarCard') ---
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

  // --- ITEM (Corrige erro TS2339 'adicionarItem') ---
  adicionarItem(card: any, descricao: string) {
    if (!descricao) return;

    const ordem = card.itens ? card.itens.length + 1 : 1;

    this.checklistService.adicionarItem(card.id, descricao, ordem)
      .subscribe({
        next: () => {
          if (!card.itens) card.itens = [];
          card.itens.push({
            id: 'temp-' + Date.now(),
            descricao: descricao,
            ordem: ordem,
            marcado: false
          });
        },
        error: () => this.snackBar.open('Erro ao adicionar item.', 'Fechar', { duration: 3000 })
      });
  }

  // --- HELPERS (Corrige erro TS2339 'getNomeResponsavel') ---
  getNomeResponsavel(usuarioId: number): string {
    // Ajuste importante: MembroEquipe tem 'id' direto, não 'usuario.id'
    const membro = this.membros.find(m => m.id === usuarioId);
    return membro ? membro.nomeCompleto : 'Desconhecido';
  }
}
