import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { ProdutoService } from '../../core/services/produto.service';
import { ProdutoResponse } from '../../core/models/produto.interfaces';

// Imports do Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Importar o Componente do Diálogo
import { ProdutoFormDialog } from '../../components/dialogs/produto-form-dialog/produto-form-dialog';

@Component({
  selector: 'app-produtos',
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
  templateUrl: './produtos.html',
  styleUrl: './produtos.scss'
})
export class Produtos implements OnInit {

  // Usar BehaviorSubject para permitir recarregamento fácil da tabela
  private produtosSubject = new BehaviorSubject<ProdutoResponse[]>([]);
  public produtos$ = this.produtosSubject.asObservable();

  public displayedColumns: string[] = ['nome', 'codigo', 'descricao', 'preco', 'acoes'];

  constructor(
    private produtoService: ProdutoService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.carregarProdutos();
  }

  carregarProdutos(): void {
    this.produtoService.getProdutos().subscribe(data => {
      this.produtosSubject.next(data);
    });
  }

  adicionarProduto(): void {
    const dialogRef = this.dialog.open(ProdutoFormDialog, {
      width: '500px',
      data: null // Modo de criação
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado) {
        this.produtoService.criarProduto(resultado).subscribe({
          next: () => {
            this.snackBar.open('Produto criado com sucesso!', 'OK', { duration: 3000 });
            this.carregarProdutos(); // Atualiza a tabela
          },
          error: (err) => {
            console.error('Erro ao criar produto', err);
            this.snackBar.open('Erro ao criar produto.', 'Fechar', { duration: 5000 });
          }
        });
      }
    });
  }

  editarProduto(produto: ProdutoResponse): void {
    const dialogRef = this.dialog.open(ProdutoFormDialog, {
      width: '500px',
      data: produto // Passa o produto para o modo de edição
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado) {
        this.produtoService.atualizarProduto(produto.id, resultado).subscribe({
          next: () => {
            this.snackBar.open('Produto atualizado com sucesso!', 'OK', { duration: 3000 });
            this.carregarProdutos();
          },
          error: (err) => {
            console.error('Erro ao atualizar produto', err);
            this.snackBar.open('Erro ao atualizar produto.', 'Fechar', { duration: 5000 });
          }
        });
      }
    });
  }

  removerProduto(produto: ProdutoResponse): void {
    if (confirm(`Tem certeza que deseja remover o produto "${produto.nome}"?`)) {
      this.produtoService.removerProduto(produto.id).subscribe({
        next: () => {
          this.snackBar.open('Produto removido com sucesso!', 'OK', { duration: 3000 });
          this.carregarProdutos();
        },
        error: (err) => {
          console.error('Erro ao remover produto', err);
          this.snackBar.open('Erro ao remover produto.', 'Fechar', { duration: 5000 });
        }
      });
    }
  }
}
