import { Component, OnInit, OnDestroy } from '@angular/core'; // 1. Adicionar OnDestroy
import { CommonModule } from '@angular/common';
import { BehaviorSubject, Observable, Subscription, skip } from 'rxjs'; // 2. Adicionar Subscription e skip
import { FornecedorService } from '../../core/services/fornecedor.service';
import { FornecedorResponse } from '../../core/models/fornecedor.interfaces';
import { TeamService } from '../../core/team/team.service'; // 3. Importar TeamService

// Imports do Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Importar o Componente do Diálogo
import { FornecedorFormDialog } from '../../components/dialogs/fornecedor-form-dialog/fornecedor-form-dialog';

@Component({
  selector: 'app-fornecedores',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './fornecedores.html',
  styleUrls: ['./fornecedores.scss']
})
export class Fornecedores implements OnInit, OnDestroy { // 4. Implementar OnDestroy

  private fornecedoresSubject = new BehaviorSubject<FornecedorResponse[]>([]);
  public fornecedores$ = this.fornecedoresSubject.asObservable();

  public displayedColumns: string[] = ['nome', 'cnpj', 'contatoNome', 'telefone', 'email', 'acoes'];

  private teamSubscription: Subscription | undefined; // 5. Para guardar a subscrição

  constructor(
    private fornecedorService: FornecedorService,
    private teamService: TeamService, // 6. Injetar o TeamService
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.carregarFornecedores(); // Carrega os dados na primeira vez

    // 7. Ouve mudanças na equipe
    this.teamSubscription = this.teamService.equipeAtiva$.pipe(skip(1)).subscribe(() => {
      this.carregarFornecedores();
    });
  }

  ngOnDestroy(): void {
    this.teamSubscription?.unsubscribe(); // 8. Limpa a subscrição
  }

  carregarFornecedores(): void {
    this.fornecedorService.getFornecedores().subscribe(data => {
      this.fornecedoresSubject.next(data);
    });
  }

  adicionarFornecedor(): void {
    const dialogRef = this.dialog.open(FornecedorFormDialog, {
      width: '500px',
      data: null
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado) {
        this.fornecedorService.criarFornecedor(resultado).subscribe({
          next: () => {
            this.snackBar.open('Fornecedor criado com sucesso!', 'OK', { duration: 3000 });
            this.carregarFornecedores();
          },
          error: (err) => {
            console.error('Erro ao criar fornecedor', err);
            this.snackBar.open('Erro ao criar fornecedor.', 'Fechar', { duration: 5000 });
          }
        });
      }
    });
  }

  editarFornecedor(fornecedor: FornecedorResponse): void {
    const dialogRef = this.dialog.open(FornecedorFormDialog, {
      width: '500px',
      data: fornecedor
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado) {
        this.fornecedorService.atualizarFornecedor(fornecedor.id, resultado).subscribe({
          next: () => {
            this.snackBar.open('Fornecedor atualizado com sucesso!', 'OK', { duration: 3000 });
            this.carregarFornecedores();
          },
          error: (err) => {
            console.error('Erro ao atualizar fornecedor', err);
            this.snackBar.open('Erro ao atualizar fornecedor.', 'Fechar', { duration: 5000 });
          }
        });
      }
    });
  }

  removerFornecedor(fornecedor: FornecedorResponse): void {
    if (confirm(`Tem certeza que deseja remover "${fornecedor.nome}"?`)) {
      this.fornecedorService.removerFornecedor(fornecedor.id).subscribe({
        next: () => {
          this.snackBar.open('Fornecedor removido com sucesso!', 'OK', { duration: 3000 });
          this.carregarFornecedores();
        },
        error: (err) => {
          console.error('Erro ao remover fornecedor', err);
          this.snackBar.open('Erro ao remover fornecedor.', 'Fechar', { duration: 5000 });
        }
      });
    }
  }
}
