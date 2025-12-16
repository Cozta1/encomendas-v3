import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { EquipeService, MembroEquipe } from '../../../core/services/equipe.service';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-membros-equipe-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './membros-equipe-dialog.html',
  styleUrls: ['./membros-equipe-dialog.scss']
})
export class MembrosEquipeDialog implements OnInit {
  membros: MembroEquipe[] = [];
  displayedColumns: string[] = ['nome', 'email', 'cargo', 'funcao', 'acoes'];
  currentUserId: number | null = null;

  constructor(
    public dialogRef: MatDialogRef<MembrosEquipeDialog>,
    private equipeService: EquipeService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any // Pode receber dados se necessário
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
    if (confirm(`Tem certeza que deseja remover ${membro.nomeCompleto} da equipe?`)) {
      this.equipeService.removerMembro(membro.id).subscribe({
        next: () => {
          this.snackBar.open('Membro removido com sucesso.', 'OK', { duration: 3000 });
          this.carregarMembros(); // Recarrega a lista
        },
        error: (err) => {
          this.snackBar.open('Erro ao remover membro.', 'Fechar', { duration: 3000 });
        }
      });
    }
  }

  getRoleLabel(role: string): string {
    return role === 'ROLE_ADMIN' ? 'Admin' : 'Membro';
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
