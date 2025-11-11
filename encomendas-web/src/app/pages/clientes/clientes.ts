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

// --- CORREÇÃO AQUI ---
// Removemos o '.component' do final do caminho e da classe
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
    MatDialogModule
  ],
  templateUrl: './clientes.html',
  // styleUrl: './clientes.scss' // Verifique se você tem este arquivo
})
export class Clientes implements OnInit {

  public clientes$!: Observable<ClienteResponse[]>;
  public displayedColumns: string[] = ['nome', 'email', 'telefone', 'cpfCnpj', 'acoes'];

  constructor(
    private clienteService: ClienteService,
    private dialog: MatDialog
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
      data: null
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado) {
        this.clienteService.criarCliente(resultado).subscribe({
          next: () => { // Corrigido de ()_ para ()
            console.log('Cliente criado com sucesso!');
            this.carregarClientes();
          },
          error: (err: any) => { // Especifica o tipo 'any' para o erro
            console.error('Erro ao criar cliente', err);
          }
        });
      }
    });
  }

  editarCliente(cliente: ClienteResponse): void {
    console.log('TODO: Editar cliente', cliente.id);
  }

  removerCliente(cliente: ClienteResponse): void {
    console.log('TODO: Remover cliente', cliente.id);
  }
}
