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

import { ChecklistService } from '../../../core/services/checklist.service';
import { ChecklistCard, ChecklistItem } from '../../../core/models/checklist.interfaces';

@Component({
  selector: 'app-checklist-card-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatButtonModule,
    MatIconModule, MatCheckboxModule, MatInputModule, MatFormFieldModule,
    MatProgressBarModule, MatSnackBarModule
  ],
  templateUrl: './checklist-card-dialog.html',
  styleUrls: ['./checklist-card-dialog.scss']
})
export class ChecklistCardDialog {
  card: ChecklistCard;
  editandoDescricao = false;
  novaDescricao = '';
  saving = false;

  constructor(
    public dialogRef: MatDialogRef<ChecklistCardDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { card: ChecklistCard, usuarioId: number },
    private checklistService: ChecklistService,
    private snackBar: MatSnackBar
  ) {
    // Usamos o objeto diretamente. Como em JS objetos são passados por referência,
    // atualizações visuais refletem no pai, mas para persistir precisamos chamar a API.
    this.card = data.card;
    this.novaDescricao = this.card.descricao || '';
  }

  get progresso(): number {
    if (!this.card.itens || this.card.itens.length === 0) return 0;
    const marcados = this.card.itens.filter((i: ChecklistItem) => i.marcado).length;
    return (marcados / this.card.itens.length) * 100;
  }

  toggleItem(item: ChecklistItem) {
    const novoValor = !item.marcado;
    item.marcado = novoValor;

    this.checklistService.registrarAcao({
      itemId: item.id,
      dataReferencia: new Date().toISOString().split('T')[0],
      valor: novoValor
    }, this.data.usuarioId).subscribe({
      error: () => {
        item.marcado = !novoValor; // Reverte visualmente
        this.snackBar.open('Erro ao salvar item. Tente novamente.', 'Fechar');
      }
    });
  }

  salvarDescricao() {
    this.saving = true;
    this.checklistService.atualizarDescricaoCard(this.card.id, this.novaDescricao).subscribe({
      next: () => {
        this.card.descricao = this.novaDescricao;
        this.editandoDescricao = false;
        this.saving = false;
        this.snackBar.open('Descrição atualizada!', 'OK', { duration: 2000 });
      },
      error: (err) => {
        console.error(err);
        this.saving = false;
        this.snackBar.open('Erro ao salvar descrição.', 'Fechar');
      }
    });
  }

  adicionarAnexo() {
    // Futura implementação com input type="file"
    this.snackBar.open('Upload de arquivos em breve!', 'OK');
  }

  fechar() {
    this.dialogRef.close();
  }
}
