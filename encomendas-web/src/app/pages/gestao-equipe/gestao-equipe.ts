import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

// Importações atualizadas para usar o TeamService e os Dialogs
import { TeamService, Equipe } from '../../core/team/team.service';
import { AuthService } from '../../core/auth/auth.service';
import { InviteDialog } from '../../components/dialogs/invite-dialog/invite-dialog';
import { MembrosEquipeDialog } from '../../components/dialogs/membros-equipe-dialog/membros-equipe-dialog';
import { EquipeFormDialog } from '../../components/dialogs/equipe-form-dialog/equipe-form-dialog';

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
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './gestao-equipe.html',
  styleUrl: './gestao-equipe.scss'
})
export class GestaoEquipe implements OnInit {
  equipes: Equipe[] = [];
  displayedColumns: string[] = ['nome', 'responsavel', 'acoes'];
  isAdminGlobal = false;

  constructor(
    private teamService: TeamService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.isAdminGlobal = this.authService.isAdmin();
    this.carregarEquipes();
  }

  carregarEquipes(): void {
    // Busca todas as equipes do usuário para listar na tabela
    this.teamService.fetchEquipesDoUsuario().subscribe({
      next: (data) => this.equipes = data,
      error: (err) => console.error('Erro ao carregar equipes', err)
    });
  }

  // --- Ações da Tabela ---

  criarEquipe(): void {
    const dialogRef = this.dialog.open(EquipeFormDialog, { width: '500px' });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.teamService.criarEquipe(result).subscribe({
          next: (nova) => {
            this.snackBar.open('Equipe criada com sucesso!', 'OK', { duration: 3000 });
            this.carregarEquipes();
          },
          error: () => this.snackBar.open('Erro ao criar equipe.', 'Fechar', { duration: 3000 })
        });
      }
    });
  }

  abrirConviteDialog(equipe: Equipe): void {
    const dialogRef = this.dialog.open(InviteDialog, { width: '400px' });

    dialogRef.afterClosed().subscribe(email => {
      if (email) {
        this.teamService.enviarConvite(equipe.id, email).subscribe({
          next: () => this.snackBar.open(`Convite enviado para ${email}`, 'OK', { duration: 3000 }),
          error: () => this.snackBar.open('Erro ao enviar convite.', 'Fechar', { duration: 5000 })
        });
      }
    });
  }

  abrirGestaoMembros(equipe: Equipe): void {
    // Define a equipe como ativa para garantir que a gestão de membros funcione corretamente
    this.teamService.selecionarEquipe(equipe);

    const dialogRef = this.dialog.open(MembrosEquipeDialog, {
      width: '900px',
      maxWidth: '95vw',
      data: { equipe: equipe }
    });

    dialogRef.afterClosed().subscribe(() => {
      // Recarrega se necessário
    });
  }
}
