import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { EncomendaService } from '../../core/services/encomenda.service';
import { EncomendaResponse } from '../../core/models/encomenda.interfaces';

// Imports do Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

// Importar o Componente do Diálogo de Formulário
import { EncomendaFormDialog } from '../../components/dialogs/encomenda-form-dialog/encomenda-form-dialog';
// --- IMPORTAR O NOVO DIÁLOGO DE DETALHES ---
import { EncomendaDetalheDialog } from '../../components/dialogs/encomenda-detalhe-dialog/encomenda-detalhe-dialog';


@Component({
  selector: 'app-encomendas',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatSnackBarModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './encomendas.html',
  styleUrl: './encomendas.scss'
})
export class Encomendas implements OnInit {

  private encomendasSubject = new BehaviorSubject<EncomendaResponse[]>([]);
  public encomendas$ = this.encomendasSubject.asObservable();

  public displayedColumns: string[] = ['data', 'cliente', 'status', 'itens', 'total', 'acoes'];

  constructor(
    private encomendaService: EncomendaService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.carregarEncomendas();
  }

  carregarEncomendas(): void {
    this.encomendaService.getEncomendas().subscribe(data => {
      this.encomendasSubject.next(data);
    });
  }

  novaEncomenda(): void {
    const dialogRef = this.dialog.open(EncomendaFormDialog, {
      width: '700px',
      data: null
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado) {
        this.encomendaService.criarEncomenda(resultado).subscribe({
          next: () => {
            this.snackBar.open('Encomenda criada com sucesso!', 'OK', { duration: 3000 });
            this.carregarEncomendas();
          },
          error: (err) => {
            console.error('Erro ao criar encomenda', err);
            this.snackBar.open('Erro ao criar encomenda.', 'Fechar', { duration: 5000 });
          }
        });
      }
    });
  }

  avancarEtapa(encomenda: EncomendaResponse): void {
    if (confirm(`Tem certeza que deseja AVANÇAR a etapa da encomenda de "${encomenda.cliente.nome}"?`)) {
      this.encomendaService.avancarEtapa(encomenda.id).subscribe({
        next: (encomendaAtualizada) => {
          this.snackBar.open(`Status alterado para: ${encomendaAtualizada.status}`, 'OK', { duration: 3000 });
          this.carregarEncomendas();
        },
        error: (err) => {
          console.error('Erro ao avançar etapa', err);
          this.snackBar.open(err.error?.message || 'Erro ao avançar etapa.', 'Fechar', { duration: 5000 });
        }
      });
    }
  }

  retornarEtapa(encomenda: EncomendaResponse): void {
    if (confirm(`Tem certeza que deseja RETORNAR a etapa da encomenda de "${encomenda.cliente.nome}"?`)) {
      this.encomendaService.retornarEtapa(encomenda.id).subscribe({
        next: (encomendaAtualizada) => {
          this.snackBar.open(`Status alterado para: ${encomendaAtualizada.status}`, 'OK', { duration: 3000 });
          this.carregarEncomendas();
        },
        error: (err) => {
          console.error('Erro ao retornar etapa', err);
          this.snackBar.open(err.error?.message || 'Erro ao retornar etapa.', 'Fechar', { duration: 5000 });
        }
      });
    }
  }

  // --- MÉTODO ATUALIZADO ---
  verDetalhes(encomenda: EncomendaResponse): void {
    // Abre o novo diálogo de detalhes, passando a encomenda
    this.dialog.open(EncomendaDetalheDialog, {
      width: '600px', // Um pouco mais estreito que o form
      data: encomenda // Passa o objeto 'encomenda' completo
    });
  }

  removerEncomenda(encomenda: EncomendaResponse): void {
    if (confirm(`Tem certeza que deseja REMOVER a encomenda de "${encomenda.cliente.nome}"?`)) {
      this.encomendaService.removerEncomenda(encomenda.id).subscribe({
        next: () => {
          this.snackBar.open('Encomenda removida com sucesso!', 'OK', { duration: 3000 });
          this.carregarEncomendas();
        },
        error: (err) => {
          console.error('Erro ao remover encomenda', err);
          this.snackBar.open('Erro ao remover encomenda.', 'Fechar', { duration: 5000 });
        }
      });
    }
  }
}
