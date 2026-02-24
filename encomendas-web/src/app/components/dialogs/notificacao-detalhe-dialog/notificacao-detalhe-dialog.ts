import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { Notificacao } from '../../../core/models/notificacao.interfaces';

@Component({
  selector: 'app-notificacao-detalhe-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatDividerModule],
  templateUrl: './notificacao-detalhe-dialog.html',
  styleUrls: ['./notificacao-detalhe-dialog.scss']
})
export class NotificacaoDetalheDialog {

  constructor(
    public dialogRef: MatDialogRef<NotificacaoDetalheDialog>,
    @Inject(MAT_DIALOG_DATA) public notificacao: Notificacao,
    private router: Router
  ) {}

  get isChecklistFechada(): boolean {
    return !this.notificacao.remetenteId &&
           this.notificacao.titulo === 'Checklist fechada incompleta';
  }

  irParaRelatorio(): void {
    this.dialogRef.close();
    this.router.navigate(['/admin/checklists']);
  }
}