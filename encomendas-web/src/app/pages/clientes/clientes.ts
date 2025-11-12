import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, BehaviorSubject, switchMap, of } from 'rxjs'; // Importar BehaviorSubject e operadores
import { ClienteService } from '../../core/services/cliente.service';
import { ClienteResponse, ClienteRequest } from '../../core/models/cliente.interfaces';

// Imports do Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog'; // Importar MatDialog

// Importar o Componente do Diálogo
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
    MatDialogModule // Adicionar MatDialogModule
  ],
  templateUrl: './clientes.html',
  styleUrl: './clientes.scss'
})
export class Clientes implements OnInit {

  // Usar um BehaviorSubject para permitir a atualização da lista
  private clientesSubject = new BehaviorSubject<ClienteResponse[]>([]);
  public clientes$ = this.clientesSubject.asObservable();

  public displayedColumns: string[] = ['nome', 'email', 'telefone', 'cpfCnpj', 'acoes'];

  constructor(
    private clienteService: ClienteService,
    private dialog: MatDialog // Injetar o serviço de Diálogo
  ) {}

  ngOnInit(): void {
    // Carrega os clientes na inicialização
    this.carregarClientes();
  }

  /**
   * Busca os clientes do serviço e atualiza o Subject.
   */
  carregarClientes(): void {
    this.clienteService.getClientes().subscribe(clientes => {
      this.clientesSubject.next(clientes);
    });
  }

  /**
   * Abre o modal de criação de cliente.
   */
  adicionarCliente(): void {
    const dialogRef = this.dialog.open(ClienteFormDialog, {
      width: '450px',
      data: null // Passa null para o modo "Criar"
    });

    // Depois que o modal fechar
    dialogRef.afterClosed().pipe(
      // Filtra: só continua se o resultado não for nulo (ou seja, se o usuário salvou)
      switchMap((result: ClienteRequest | undefined) => {
        if (result) {
          // Chama o serviço para criar o cliente no backend
          return this.clienteService.criarCliente(result);
        }
        return of(null); // Se o usuário cancelou, retorna um observable nulo
      })
    ).subscribe(novoCliente => {
      if (novoCliente) {
        console.log('Cliente criado com sucesso!');
        // Atualiza a tabela!
        this.carregarClientes();
      }
    });
  }

  /**
   * Abre o modal de edição de cliente.
   */
  editarCliente(cliente: ClienteResponse): void {
    event?.stopPropagation();

    // Abre o mesmo diálogo, mas passa os dados do cliente
    const dialogRef = this.dialog.open(ClienteFormDialog, {
      width: '450px',
      data: cliente // Passa o cliente para o modo "Editar"
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('TODO: Implementar lógica de ATUALIZAÇÃO do cliente', result);
        // this.clienteService.atualizarCliente(cliente.id, result).subscribe(...)
        // this.carregarClientes();
      }
    });
  }

  /**
   * (TODO) Abre um diálogo de confirmação para remover o cliente.
   */
  removerCliente(cliente: ClienteResponse): void {
    event?.stopPropagation();
    console.log('TODO: Abrir confirmação de remoção para:', cliente.nome);
    // const confirmRef = this.dialog.open(ConfirmDialogComponent, { data: { ... } });
    // confirmRef.afterClosed().subscribe(confirmado => {
    //   if (confirmado) {
    //     this.clienteService.removerCliente(cliente.id).subscribe(() => this.carregarClientes());
    //   }
    // });
  }
}
