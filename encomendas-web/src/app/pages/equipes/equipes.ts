import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';

import { TeamService, Equipe } from '../../core/team/team.service';
import { AuthService } from '../../core/auth/auth.service';
import { EquipeFormDialog } from '../../components/dialogs/equipe-form-dialog/equipe-form-dialog';

@Component({
  selector: 'app-equipes-page', // Mudei o seletor para não conflitar com a lista interna
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './equipes.html',
  styleUrls: ['./equipes.scss']
})
export class EquipesPage implements OnInit {

  equipes$!: Observable<Equipe[]>;
  displayedColumns: string[] = ['nome', 'id', 'status', 'acoes'];
  isAdmin = false;

  constructor(
    private teamService: TeamService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.carregarEquipes();
  }

  carregarEquipes(): void {
    this.equipes$ = this.teamService.fetchEquipesDoUsuario();
  }

  criarEquipe(): void {
    if (!this.isAdmin) return;

    const dialogRef = this.dialog.open(EquipeFormDialog, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // O service precisa ter o método criarEquipe (vamos adicionar abaixo se não tiver)
        // Como o TeamService atual só tinha fetch, vou simular a chamada HTTP aqui ou adicionar no service
        this.teamService.criarEquipe(result).subscribe({
          next: (novaEquipe) => {
            this.snackBar.open('Equipe criada com sucesso!', 'OK', { duration: 3000 });
            this.carregarEquipes();
            // Opcional: Selecionar a nova equipe
            this.teamService.selecionarEquipe(novaEquipe);
          },
          error: (err) => {
            this.snackBar.open('Erro ao criar equipe.', 'Fechar', { duration: 5000 });
          }
        });
      }
    });
  }

  selecionar(equipe: Equipe): void {
    this.teamService.selecionarEquipe(equipe);
    this.snackBar.open(`Equipe "${equipe.nome}" selecionada.`, 'OK', { duration: 2000 });
  }
}
