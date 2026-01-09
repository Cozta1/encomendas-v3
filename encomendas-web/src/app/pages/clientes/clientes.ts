import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, Observable, Subscription, skip } from 'rxjs';
import { ClienteService } from '../../core/services/cliente.service';
import { ClienteResponse } from '../../core/models/cliente.interfaces';
import { TeamService } from '../../core/team/team.service';

import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
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
    MatSnackBarModule
  ],
  templateUrl: './clientes.html',
  styleUrl: './clientes.scss'
})
export class Clientes implements OnInit, OnDestroy {

  private clientesSubject = new BehaviorSubject<ClienteResponse[]>([]);
  public clientes$ = this.clientesSubject.asObservable();

  // ATUALIZADO: Adicionado 'codigoInterno' no início da lista de colunas
  public displayedColumns: string[] = ['codigoInterno', 'nome', 'email', 'telefone', 'cpf', 'acoes'];

  private teamSubscription: Subscription | undefined;

  constructor(
    private clienteService: ClienteService,
    private teamService: TeamService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.carregarClientes();

    this.teamSubscription = this.teamService.equipeAtiva$.pipe(skip(1)).subscribe(() => {
      this.carregarClientes();
    });
  }

  ngOnDestroy(): void {
    this.teamSubscription?.unsubscribe();
  }

  carregarClientes(): void {
    this.clienteService.getClientes().subscribe(data => {
      this.clientesSubject.next(data);
    });
  }

  adicionarCliente(): void {
    const dialogRef = this.dialog.open(ClienteFormDialog, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: null
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado) {
        this.clienteService.criarCliente(resultado).subscribe({
          next: () => {
            this.snackBar.open('Cliente criado com sucesso!', 'OK', { duration: 3000 });
            this.carregarClientes();
          },
          error: (err) => {
            console.error('Erro ao criar cliente', err);
            this.snackBar.open('Erro ao criar cliente.', 'Fechar', { duration: 5000 });
          }
        });
      }
    });
  }

  editarCliente(cliente: ClienteResponse): void {
    const dialogRef = this.dialog.open(ClienteFormDialog, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: cliente
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado) {
        this.clienteService.atualizarCliente(cliente.id, resultado).subscribe({
          next: () => {
            this.snackBar.open('Cliente atualizado com sucesso!', 'OK', { duration: 3000 });
            this.carregarClientes();
          },
          error: (err) => {
            console.error('Erro ao atualizar cliente', err);
            this.snackBar.open('Erro ao atualizar cliente.', 'Fechar', { duration: 5000 });
          }
        });
      }
    });
  }

  removerCliente(cliente: ClienteResponse): void {
    if (confirm(`Tem certeza que deseja remover o cliente "${cliente.nome}"?`)) {
      this.clienteService.removerCliente(cliente.id).subscribe({
        next: () => {
          this.snackBar.open('Cliente removido com sucesso!', 'OK', { duration: 3000 });
          this.carregarClientes();
        },
        error: (err) => {
          console.error('Erro ao remover cliente', err);
          this.snackBar.open('Erro ao remover cliente.', 'Fechar', { duration: 5000 });
        }
      });
    }
  }
}
