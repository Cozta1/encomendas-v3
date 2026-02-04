import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

import { ChecklistService } from '../../core/services/checklist.service';
import { TeamService } from '../../core/team/team.service';
import { UsuarioResponse } from '../../core/models/usuario.interfaces';
import { ChecklistBoard } from '../../core/models/checklist.interfaces';

@Component({
  selector: 'app-checklist-criador',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatExpansionModule, MatSelectModule,
    MatSnackBarModule, MatTooltipModule, MatDividerModule
  ],
  templateUrl: './checklist-criador.html',
  styleUrls: ['./checklist-criador.scss']
})
export class ChecklistCriadorComponent implements OnInit {
  boards: ChecklistBoard[] = [];
  membros: UsuarioResponse[] = [];
  equipeId: string | null = null;
  loading = false;

  // Forms
  novoBoardForm: FormGroup;
  novoCardForm: FormGroup;
  novoItemForm: FormGroup;

  // Controles de UI
  boardAtivoId: string | null = null;
  cardAtivoId: string | null = null;

  constructor(
    private checklistService: ChecklistService,
    private teamService: TeamService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.novoBoardForm = this.fb.group({
      nome: ['', Validators.required],
      usuarioId: [null]
    });

    this.novoCardForm = this.fb.group({
      titulo: ['', Validators.required],
      horarioAbertura: ['08:00', Validators.required],
      horarioFechamento: ['18:00', Validators.required]
    });

    this.novoItemForm = this.fb.group({
      descricao: ['', Validators.required],
      ordem: [1, Validators.required]
    });
  }

  ngOnInit(): void {
    this.equipeId = this.teamService.getEquipeAtivaId();
    if (this.equipeId) {
      this.carregarMembros();
      this.carregarBoards();
    }
  }

  carregarMembros() {
    if (!this.equipeId) return;
    this.teamService.getMembros(this.equipeId).subscribe(data => this.membros = data);
  }

  carregarBoards() {
    if (!this.equipeId) return;
    this.loading = true;

    // CORREÇÃO: Usa getAllBoards para visão administrativa (não depende de escala/hoje)
    this.checklistService.getAllBoards(this.equipeId).subscribe({
      next: (res) => {
        this.boards = res;
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Erro ao carregar checklists.', 'Fechar');
        this.loading = false;
      }
    });
  }

  // --- BOARDS ---
  criarBoard() {
    if (this.novoBoardForm.invalid || !this.equipeId) return;
    const { nome, usuarioId } = this.novoBoardForm.value;

    this.checklistService.criarBoard(nome, this.equipeId, usuarioId).subscribe({
      next: () => {
        this.snackBar.open('Checklist criado com sucesso!', 'OK', { duration: 3000 });
        this.novoBoardForm.reset();
        this.carregarBoards();
      },
      error: () => this.snackBar.open('Erro ao criar checklist.', 'Fechar')
    });
  }

  // --- CARDS ---
  prepararNovoCard(boardId: string) {
    this.boardAtivoId = boardId;
    this.cardAtivoId = null;
    this.novoCardForm.reset({ horarioAbertura: '08:00', horarioFechamento: '18:00' });
  }

  salvarCard() {
    if (this.novoCardForm.invalid || !this.boardAtivoId) return;
    const { titulo, horarioAbertura, horarioFechamento } = this.novoCardForm.value;

    const inicio = horarioAbertura.length === 5 ? horarioAbertura + ':00' : horarioAbertura;
    const fim = horarioFechamento.length === 5 ? horarioFechamento + ':00' : horarioFechamento;

    this.checklistService.adicionarCard(this.boardAtivoId, titulo, inicio, fim).subscribe({
      next: () => {
        this.snackBar.open('Bloco de horário adicionado!', 'OK', { duration: 2000 });
        this.boardAtivoId = null;
        this.carregarBoards();
      },
      error: () => this.snackBar.open('Erro ao adicionar bloco.', 'Fechar')
    });
  }

  // --- ITENS ---
  prepararNovoItem(cardId: string) {
    this.cardAtivoId = cardId;
    this.novoItemForm.reset({ ordem: 1 });
  }

  salvarItem() {
    if (this.novoItemForm.invalid || !this.cardAtivoId) return;
    const { descricao, ordem } = this.novoItemForm.value;

    this.checklistService.adicionarItem(this.cardAtivoId, descricao, ordem).subscribe({
      next: () => {
        this.snackBar.open('Tarefa adicionada!', 'OK', { duration: 2000 });
        this.cardAtivoId = null;
        this.carregarBoards();
      },
      error: () => this.snackBar.open('Erro ao adicionar tarefa.', 'Fechar')
    });
  }

  getNomeUsuario(id?: number | null): string {
    if (!id) return 'Todos da Equipe';
    const user = this.membros.find(m => m.id === id);
    return user ? user.nomeCompleto : 'Usuário Desconhecido';
  }
}
