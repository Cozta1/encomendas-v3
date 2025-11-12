import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs'; // Importar BehaviorSubject
import { FornecedorService } from '../../core/services/fornecedor.service';
import { FornecedorResponse, FornecedorRequest } from '../../core/models/fornecedor.interfaces';

// Imports do Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // Para notificações

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
    MatSnackBarModule // Adicionado
  ],
  templateUrl: './fornecedores.html', // Corrigido para .component.html
  styleUrls: ['./fornecedores.scss'] // Corrigido para .component.scss
})
export class Fornecedores implements OnInit { // Nome da classe corrigido

  // --- MUDANÇA: Usar BehaviorSubject ---
  private fornecedoresSubject = new BehaviorSubject<FornecedorResponse[]>([]);
  public fornecedores$ = this.fornecedoresSubject.asObservable();

  public displayedColumns: string[] = ['nome', 'cnpj', 'contatoNome', 'telefone', 'email', 'acoes'];

  constructor(
    private fornecedorService: FornecedorService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.carregarFornecedores();
  }

  carregarFornecedores(): void {
    // Agora o subscribe atualiza o Subject
    this.fornecedorService.getFornecedores().subscribe(data => {
      this.fornecedoresSubject.next(data);
    });
  }

  adicionarFornecedor(): void {
    const dialogRef = this.dialog.open(FornecedorFormDialog, {
      width: '500px',
      data: null // Modo de criação
    });

    // Ouve o que acontece quando o modal é fechado
    dialogRef.afterClosed().subscribe(resultado => {
      // Se o usuário clicou em "Salvar"
      if (resultado) {
        this.fornecedorService.criarFornecedor(resultado).subscribe({
          next: () => {
            this.snackBar.open('Fornecedor criado com sucesso!', 'OK', { duration: 3000 });
            this.carregarFornecedores(); // Atualiza a tabela!
          },
          error: (err) => {
            console.error('Erro ao criar fornecedor', err);
            this.snackBar.open('Erro ao criar fornecedor.', 'Fechar', { duration: 5000 });
          }
        });
      }
    });
  }

  // --- MÉTODO ATUALIZADO ---
  editarFornecedor(fornecedor: FornecedorResponse): void {
    const dialogRef = this.dialog.open(FornecedorFormDialog, {
      width: '500px',
      data: fornecedor // Passa o fornecedor para o modo de edição
    });

    dialogRef.afterClosed().subscribe(resultado => {
      // Se o usuário clicou em "Salvar" (resultado não é nulo)
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

  // --- MÉTODO ATUALIZADO ---
  removerFornecedor(fornecedor: FornecedorResponse): void {
    // --- USA CONFIRM SIMPLES POR ENQUANTO ---
    // (Em produção, use um MatDialog de confirmação)
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
