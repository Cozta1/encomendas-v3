import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs'; // Importar Tabs
import { MatChipsModule } from '@angular/material/chips'; // Importar Chips
import { Observable } from 'rxjs';

import { TeamService, Equipe, Convite } from '../../core/team/team.service';
import { AuthService } from '../../core/auth/auth.service';
import { EquipeFormDialog } from '../../components/dialogs/equipe-form-dialog/equipe-form-dialog';
import { InviteDialog } from '../../components/dialogs/invite-dialog/invite-dialog';

@Component({
  selector: 'app-equipes-page',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatDialogModule, MatSnackBarModule, MatTabsModule, MatChipsModule
  ],
  templateUrl: './equipes.html',
  styleUrls: ['./equipes.scss']
})
export class EquipesPage implements OnInit {
  equipes: Equipe[] = [];
  convitesPendentes: Convite[] = [];

  // Colunas da tabela
  displayedColumns: string[] = ['nome', 'responsavel', 'acoes'];
  displayedColumnsConvites: string[] = ['equipe', 'status', 'acoes'];

  isAdminGlobal = false; // Se é admin do sistema (ROLE_ADMIN)

  constructor(
    private teamService: TeamService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.isAdminGlobal = this.authService.isAdmin();
    this.carregarDados();
  }

  carregarDados(): void {
    // 1. Carrega Equipes
    this.teamService.fetchEquipesDoUsuario().subscribe(data => this.equipes = data);

    // 2. Carrega Convites Pendentes (se não for admin ou pra todos)
    this.teamService.listarMeusConvitesPendentes().subscribe(data => this.convitesPendentes = data);
  }

  criarEquipe(): void {
    const dialogRef = this.dialog.open(EquipeFormDialog, { width: '500px' });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.teamService.criarEquipe(result).subscribe({
          next: (nova) => {
            this.snackBar.open('Equipe criada!', 'OK', { duration: 3000 });
            this.carregarDados();
            this.teamService.selecionarEquipe(nova);
          },
          error: () => this.snackBar.open('Erro ao criar.', 'Fechar', { duration: 5000 })
        });
      }
    });
  }

  selecionar(equipe: Equipe): void {
    this.teamService.selecionarEquipe(equipe);
    this.snackBar.open(`Equipe "${equipe.nome}" selecionada.`, 'OK', { duration: 2000 });
  }

  // --- Lógica de Convites ---

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

  aceitarConvite(convite: Convite): void {
    this.teamService.aceitarConvite(convite.id).subscribe({
      next: () => {
        this.snackBar.open('Convite aceito! Atualize para ver a equipe.', 'OK', { duration: 3000 });
        this.carregarDados(); // Recarrega para sumir o convite e aparecer a equipe
      },
      error: () => this.snackBar.open('Erro ao aceitar.', 'Fechar', { duration: 5000 })
    });
  }
}
