import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

import { NotificacaoService } from '../../../core/services/notificacao.service';
import { UsuarioResponse } from '../../../core/models/usuario.interfaces';

@Component({
  selector: 'app-enviar-notificacao-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule,
    MatButtonModule, MatFormFieldModule, MatInputModule,
    MatCheckboxModule, MatDividerModule, MatSnackBarModule
  ],
  templateUrl: './enviar-notificacao-dialog.html',
  styleUrls: ['./enviar-notificacao-dialog.scss']
})
export class EnviarNotificacaoDialog {
  destinatariosIds = new Set<number>();
  titulo = '';
  mensagem = '';
  enviando = false;

  constructor(
    public dialogRef: MatDialogRef<EnviarNotificacaoDialog>,
    @Inject(MAT_DIALOG_DATA) public data: {
      equipeId: string;
      remetenteId: number;
      membros: UsuarioResponse[];
    },
    private notificacaoService: NotificacaoService,
    private snackBar: MatSnackBar
  ) {}

  get todosSelected(): boolean {
    return this.data.membros.length > 0 &&
           this.destinatariosIds.size === this.data.membros.length;
  }

  get algunsSelected(): boolean {
    return this.destinatariosIds.size > 0 && !this.todosSelected;
  }

  toggleTodos(): void {
    if (this.todosSelected) {
      this.destinatariosIds.clear();
    } else {
      this.data.membros.forEach(m => this.destinatariosIds.add(m.id));
    }
  }

  toggleMembro(id: number): void {
    if (this.destinatariosIds.has(id)) {
      this.destinatariosIds.delete(id);
    } else {
      this.destinatariosIds.add(id);
    }
  }

  enviar(): void {
    if (!this.titulo.trim() || !this.mensagem.trim() || this.destinatariosIds.size === 0) return;

    this.enviando = true;
    const base = {
      equipeId: this.data.equipeId,
      remetenteId: this.data.remetenteId,
      titulo: this.titulo.trim(),
      mensagem: this.mensagem.trim()
    };

    const obs$ = this.todosSelected
      ? this.notificacaoService.enviarNotificacao({ ...base, destinatarioId: null })
      : forkJoin(
          Array.from(this.destinatariosIds).map(id =>
            this.notificacaoService.enviarNotificacao({ ...base, destinatarioId: id })
          )
        ).pipe(map(() => void 0));

    obs$.subscribe({
      next: () => {
        this.snackBar.open('Notificação enviada!', '', { duration: 2500 });
        this.dialogRef.close(true);
      },
      error: () => {
        this.enviando = false;
        this.snackBar.open('Erro ao enviar notificação.', 'Fechar', { duration: 3000 });
      }
    });
  }
}