import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { ClienteService } from '../../core/services/cliente.service';
import { ClienteResponse } from '../../core/models/cliente.interfaces';

// Imports do Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // Para notificações
import { ClienteFormDialog } from '../../components/dialogs/cliente-form-dialog/cliente-form-dialog';

@Component({
  selector: 'app-clientes',
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
  templateUrl: './clientes.html',
  styleUrl: './clientes.scss'
})
export class Clientes implements OnInit {

  public clientes$!: Observable<ClienteResponse[]>;
  public displayedColumns: string[] = ['nome', 'email', 'telefone', 'cpfCnpj', 'acoes'];

  constructor(
    private clienteService: ClienteService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar // Adicionado
  ) {}

  ngOnInit(): void {
    this.carregarClientes();
  }

  carregarClientes(): void {
    this.clientes$ = this.clienteService.getClientes();
  }

  adicionarCliente(): void {
    const dialogRef = this.dialog.open(ClienteFormDialog, {
      width: '500px',
      data: null // Modo de criação
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado) {
        this.clienteService.criarCliente(resultado).subscribe({
          next: () => {
            this.snackBar.open('Cliente criado com sucesso!', 'OK', { duration: 3000 });
            this.carregarClientes(); // Atualiza a tabela!
          },
          error: (err) => {
            console.error('Erro ao criar cliente', err);
            this.snackBar.open('Erro ao criar cliente.', 'Fechar', { duration: 5000 });
          }
        });
      }
    });
  }

  // --- MÉTODO ATUALIZADO (EDITAR) ---
  editarCliente(cliente: ClienteResponse): void {
    // Abre o MESMO modal, mas agora passa os dados do cliente
    const dialogRef = this.dialog.open(ClienteFormDialog, {
      width: '500px',
      data: cliente // Passa os dados para preencher o formulário
    });

    dialogRef.afterClosed().subscribe(resultado => {
      // Se o usuário salvou (e não cancelou)
      if (resultado) {
        this.clienteService.atualizarCliente(cliente.id, resultado).subscribe({
          next: () => {
            this.snackBar.open('Cliente atualizado com sucesso!', 'OK', { duration: 3000 });
            this.carregarClientes(); // Atualiza a tabela
          },
          error: (err) => {
            console.error('Erro ao atualizar cliente', err);
            this.snackBar.open('Erro ao atualizar cliente.', 'Fechar', { duration: 5000 });
          }
        });
      }
    });
  }

  // --- MÉTODO ATUALIZADO (REMOVER) ---
  removerCliente(cliente: ClienteResponse): void {
    // Pergunta de confirmação simples
    if (confirm(`Tem certeza que deseja remover o cliente "${cliente.nome}"?`)) {
      this.clienteService.removerCliente(cliente.id).subscribe({
        next: () => {
          this.snackBar.open('Cliente removido com sucesso!', 'OK', { duration: 3000 });
          this.carregarClientes(); // Atualiza a tabela
        },
        error: (err) => {
          console.error('Erro ao remover cliente', err);
          this.snackBar.open('Erro ao remover cliente.', 'Fechar', { duration: 5000 });
        }
      });
    }
  }
}
