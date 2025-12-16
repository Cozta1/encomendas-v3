import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { EquipeService, MembroEquipe } from '../../core/services/equipe.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-gestao-equipe',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './gestao-equipe.html',
  styleUrl: './gestao-equipe.scss'
})
export class GestaoEquipe implements OnInit {
  membros: MembroEquipe[] = [];
  displayedColumns: string[] = ['nome', 'email', 'cargo', 'funcao', 'acoes'];
  currentUserId: number | null = null; // ID numérico

  constructor(
    private equipeService: EquipeService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    this.currentUserId = user ? user.id : null;

    this.carregarMembros();
  }

  carregarMembros(): void {
    this.equipeService.listarMembros().subscribe({
      next: (data) => this.membros = data,
      error: (err) => console.error('Erro ao carregar membros', err)
    });
  }

  removerMembro(membro: MembroEquipe): void {
    if (confirm(`Tem certeza que deseja remover ${membro.nomeCompleto}?`)) {
      this.equipeService.removerMembro(membro.id).subscribe({
        next: () => {
          this.snackBar.open('Membro removido.', 'OK', { duration: 3000 });
          this.carregarMembros();
        },
        error: () => this.snackBar.open('Erro ao remover.', 'Fechar', { duration: 3000 })
      });
    }
  }

  getRoleLabel(role: string): string {
    return role === 'ROLE_ADMIN' ? 'Admin' : 'Membro';
  }
}
