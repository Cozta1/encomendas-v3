import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ChecklistService } from '../../../core/services/checklist.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ChecklistCard, ChecklistItem } from '../../../core/models/checklist.interfaces';

@Component({
  selector: 'app-checklist-card-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatButtonModule,
    MatIconModule, MatCheckboxModule, MatInputModule, MatFormFieldModule,
    MatProgressBarModule, MatSnackBarModule, MatTooltipModule
  ],
  templateUrl: './checklist-card-dialog.html',
  styleUrls: ['./checklist-card-dialog.scss']
})
export class ChecklistCardDialog {
  card: ChecklistCard;
  editandoDescricao = false;
  novaDescricao = '';
  editandoTitulo = false;
  novoTitulo = '';
  novoItemDescricao = '';
  saving = false;

  constructor(
    public dialogRef: MatDialogRef<ChecklistCardDialog>,
    @Inject(MAT_DIALOG_DATA) public data: {
      card: ChecklistCard;
      usuarioId: number;
      dataReferencia: string;
      somenteLeitura: boolean;
      boardNome?: string;
    },
    private checklistService: ChecklistService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.card = data.card;
    this.novaDescricao = this.card.descricao || '';
    this.novoTitulo = this.card.titulo;
  }

  /** Verifica se o card está fechado: pelo status do backend OU pelo horário atual */
  get isFechado(): boolean {
    if (this.card.status === 'FECHADO') return true;
    if (!this.card.horarioFechamento) return false;
    const agora = new Date();
    const partes = this.card.horarioFechamento.split(':').map(Number);
    const fechamento = new Date();
    fechamento.setHours(partes[0], partes[1] ?? 0, partes[2] ?? 0, 0);
    return agora >= fechamento;
  }

  get isIncompleto(): boolean {
    return this.isFechado && this.progresso < 100;
  }

  /** somenteLeitura: passado pelo parent OU card já fechado pelo horário */
  get somenteLeitura(): boolean {
    return (this.data.somenteLeitura ?? false) || this.isFechado;
  }

  /** Admin pode editar estrutura (título, descrição, itens). Utilizador comum só marca itens. */
  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  /** Pode editar estrutura do card: admin + dia de hoje */
  get podeEditar(): boolean {
    return this.isAdmin && !this.somenteLeitura;
  }

  get boardNome(): string {
    return this.data.boardNome || 'Checklist Diário';
  }

  get progresso(): number {
    if (!this.card.itens || this.card.itens.length === 0) return 0;
    return (this.countMarcados() / this.card.itens.length) * 100;
  }

  countMarcados(): number {
    return this.card.itens ? this.card.itens.filter((i: ChecklistItem) => i.marcado).length : 0;
  }

  // --- CHECKLIST ITEM INTERACTIONS ---

  toggleItem(item: ChecklistItem) {
    if (this.somenteLeitura) return;

    const novoValor = !item.marcado;
    item.marcado = novoValor;

    this.checklistService.registrarAcao({
      itemId: item.id,
      dataReferencia: this.data.dataReferencia,
      valor: novoValor
    }, this.data.usuarioId).subscribe({
      error: () => {
        item.marcado = !novoValor;
        this.snackBar.open('Erro de conexão. Ação desfeita.', 'Fechar', { duration: 3000 });
      }
    });
  }

  adicionarItem() {
    const descricao = this.novoItemDescricao.trim();
    if (!descricao) return;

    const ordem = this.card.itens ? this.card.itens.length + 1 : 1;

    this.checklistService.adicionarItem(this.card.id, descricao, ordem).subscribe({
      next: (item) => {
        if (!this.card.itens) this.card.itens = [];
        this.card.itens.push(item as any);
        this.novoItemDescricao = '';
      },
      error: () => this.snackBar.open('Erro ao adicionar item.', 'Fechar', { duration: 3000 })
    });
  }

  excluirItem(item: ChecklistItem) {
    if (!confirm(`Remover o item "${item.descricao}"?`)) return;

    this.checklistService.excluirItem(item.id).subscribe({
      next: () => {
        this.card.itens = this.card.itens.filter(i => i.id !== item.id);
        this.snackBar.open('Item removido.', '', { duration: 2000 });
      },
      error: () => this.snackBar.open('Erro ao remover item.', 'Fechar', { duration: 3000 })
    });
  }

  // --- DESCRIPTION ---

  salvarDescricao() {
    this.saving = true;
    this.checklistService.atualizarCard(this.card.id, { descricao: this.novaDescricao }).subscribe({
      next: () => {
        this.card.descricao = this.novaDescricao;
        this.editandoDescricao = false;
        this.saving = false;
        this.snackBar.open('Salvo', '', { duration: 1000 });
      },
      error: (err) => {
        console.error(err);
        this.saving = false;
        this.snackBar.open('Erro ao salvar descrição.', 'Fechar');
      }
    });
  }

  // --- TITLE ---

  iniciarEditarTitulo() {
    this.novoTitulo = this.card.titulo;
    this.editandoTitulo = true;
  }

  salvarTitulo() {
    const titulo = this.novoTitulo.trim();
    if (!titulo || titulo === this.card.titulo) {
      this.editandoTitulo = false;
      return;
    }
    this.checklistService.atualizarCard(this.card.id, { titulo }).subscribe({
      next: () => {
        this.card.titulo = titulo;
        this.editandoTitulo = false;
        this.snackBar.open('Título atualizado.', '', { duration: 1500 });
      },
      error: () => this.snackBar.open('Erro ao salvar título.', 'Fechar')
    });
  }

  fechar() {
    this.dialogRef.close();
  }
}
