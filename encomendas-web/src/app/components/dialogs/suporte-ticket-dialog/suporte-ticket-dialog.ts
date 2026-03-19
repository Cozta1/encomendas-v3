import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { take } from 'rxjs/operators';

import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SuporteService } from '../../../core/services/suporte.service';
import { AuthService } from '../../../core/auth/auth.service';
import { TeamService } from '../../../core/team/team.service';

@Component({
  selector: 'app-suporte-ticket-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule,
    MatButtonModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatIconModule, MatSnackBarModule,
    MatDividerModule, MatProgressSpinnerModule
  ],
  templateUrl: './suporte-ticket-dialog.html',
  styleUrls: ['./suporte-ticket-dialog.scss']
})
export class SuporteTicketDialog implements OnInit {

  categoria = '';
  titulo = '';
  descricao = '';
  enviando = false;

  readonly categorias = [
    { valor: 'Bug / Erro',               icone: 'bug_report'    },
    { valor: 'Problema de Performance',  icone: 'speed'         },
    { valor: 'Sugestão de Melhoria',     icone: 'lightbulb'     },
    { valor: 'Dúvida / FAQ',             icone: 'help_outline'  },
    { valor: 'Outro',                    icone: 'more_horiz'    }
  ];

  get categoriaSelecionada() {
    return this.categorias.find(c => c.valor === this.categoria);
  }

  private nomeUsuario = '';
  private equipeNome = '';

  constructor(
    public dialogRef: MatDialogRef<SuporteTicketDialog>,
    private suporteService: SuporteService,
    private authService: AuthService,
    private teamService: TeamService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    this.nomeUsuario = user?.nome ?? 'Desconhecido';

    this.teamService.equipeAtiva$.pipe(take(1)).subscribe(eq => {
      if (eq) this.equipeNome = eq.nome;
    });
  }

  get formValido(): boolean {
    return !!this.categoria && this.titulo.trim().length > 0 && this.descricao.trim().length > 0;
  }

  enviar(): void {
    if (!this.formValido) return;
    this.enviando = true;

    this.suporteService.enviarTicket({
      categoria: this.categoria,
      titulo: this.titulo.trim(),
      descricao: this.descricao.trim(),
      nomeUsuario: this.nomeUsuario,
      equipeNome: this.equipeNome
    }).subscribe({
      next: () => {
        this.snackBar.open('Ticket enviado! O desenvolvedor será notificado.', '', { duration: 4000 });
        this.dialogRef.close(true);
      },
      error: () => {
        this.enviando = false;
        this.snackBar.open('Erro ao enviar o ticket. Tente novamente.', 'Fechar', { duration: 4000 });
      }
    });
  }
}