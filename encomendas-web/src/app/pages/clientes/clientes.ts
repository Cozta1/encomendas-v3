import { Component, OnInit, OnDestroy } from '@angular/core'; // 1. Adicionar OnDestroy
import { CommonModule } from '@angular/common';
import { BehaviorSubject, Observable, Subscription, skip } from 'rxjs'; // 2. Adicionar Subscription e skip
import { ClienteService } from '../../core/services/cliente.service';
import { ClienteResponse } from '../../core/models/cliente.interfaces';
import { TeamService } from '../../core/team/team.service'; // 3. Importar TeamService

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
    MatSnackBarModule
  ],
  templateUrl: './clientes.html',
  styleUrl: './clientes.scss'
})
export class Clientes implements OnInit, OnDestroy { // 4. Implementar OnDestroy

  // REFAKTOR: Usar BehaviorSubject
  private clientesSubject = new BehaviorSubject<ClienteResponse[]>([]);
  public clientes$ = this.clientesSubject.asObservable();

  public displayedColumns: string[] = ['nome', 'email', 'telefone', 'cpfCnpj', 'acoes'];

  private teamSubscription: Subscription | undefined; // 5. Para guardar a subscrição

  constructor(
    private clienteService: ClienteService,
    private teamService: TeamService, // 6. Injetar o TeamService
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.carregarClientes(); // Carrega os dados na primeira vez

    // 7. Ouve mudanças na equipe (ignora a primeira, pois 'carregarClientes' já foi chamado)
    this.teamSubscription = this.teamService.equipeAtiva$.pipe(skip(1)).subscribe(() => {
      this.carregarClientes();
    });
  }

  ngOnDestroy(): void {
    this.teamSubscription?.unsubscribe(); // 8. Limpa a subscrição
  }

  carregarClientes(): void {
    this.clienteService.getClientes().subscribe(data => {
      this.clientesSubject.next(data);
    });
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

  editarCliente(cliente: ClienteResponse): void {
    const dialogRef = this.dialog.open(ClienteFormDialog, {
      width: '500px',
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
