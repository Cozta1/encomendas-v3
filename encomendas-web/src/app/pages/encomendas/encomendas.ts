import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, Observable, Subscription, skip } from 'rxjs';
import { EncomendaService } from '../../core/services/encomenda.service';
import { EncomendaResponse } from '../../core/models/encomenda.interfaces';
import { TeamService } from '../../core/team/team.service';

import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { EncomendaFormDialog } from '../../components/dialogs/encomenda-form-dialog/encomenda-form-dialog';
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
export class Encomendas implements OnInit, OnDestroy {

  private encomendasSubject = new BehaviorSubject<EncomendaResponse[]>([]);
  public encomendas$ = this.encomendasSubject.asObservable();

  public displayedColumns: string[] = ['data', 'cliente', 'status', 'itens', 'total', 'acoes'];

  private teamSubscription: Subscription | undefined;

  constructor(
    private encomendaService: EncomendaService,
    private teamService: TeamService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.carregarEncomendas();

    this.teamSubscription = this.teamService.equipeAtiva$.pipe(skip(1)).subscribe(() => {
      this.carregarEncomendas();
    });
  }

  ngOnDestroy(): void {
    this.teamSubscription?.unsubscribe();
  }

  carregarEncomendas(): void {
    this.encomendaService.getEncomendas().subscribe(data => {
      this.encomendasSubject.next(data);
    });
  }

  novaEncomenda(): void {
    const dialogRef = this.dialog.open(EncomendaFormDialog, {
      width: '700px',
      data: null,
      autoFocus: false
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
    this.encomendaService.avancarEtapa(encomenda.id).subscribe({
      next: (encomendaAtualizada) => {
        this.snackBar.open(`Status alterado para: ${encomendaAtualizada.status}`, 'OK', { duration: 2000 });
        this.atualizarEncomendaNaLista(encomendaAtualizada);
      },
      error: (err) => {
        console.error('Erro ao avançar etapa', err);
        this.snackBar.open(err.error?.message || 'Erro ao avançar etapa.', 'Fechar', { duration: 5000 });
      }
    });
  }

  retornarEtapa(encomenda: EncomendaResponse): void {
    this.encomendaService.retornarEtapa(encomenda.id).subscribe({
      next: (encomendaAtualizada) => {
        this.snackBar.open(`Status alterado para: ${encomendaAtualizada.status}`, 'OK', { duration: 2000 });
        this.atualizarEncomendaNaLista(encomendaAtualizada);
      },
      error: (err) => {
        console.error('Erro ao retornar etapa', err);
        this.snackBar.open(err.error?.message || 'Erro ao retornar etapa.', 'Fechar', { duration: 5000 });
      }
    });
  }

  // --- LÓGICA DE TOGGLE: Cancelar / Descancelar ---
  alternarCancelamento(encomenda: EncomendaResponse): void {
    if (encomenda.status === 'Cancelado') {
      // Descancelar
      this.encomendaService.descancelarEncomenda(encomenda.id).subscribe({
        next: (encomendaAtualizada) => {
          this.snackBar.open('Encomenda REATIVADA (Pendente)', 'OK', { duration: 2000 });
          this.atualizarEncomendaNaLista(encomendaAtualizada);
        },
        error: (err) => this.snackBar.open('Erro ao reativar encomenda.', 'Fechar', { duration: 5000 })
      });
    } else {
      // Cancelar
      if (confirm('Tem certeza que deseja CANCELAR esta encomenda?')) {
        this.encomendaService.cancelarEncomenda(encomenda.id).subscribe({
          next: (encomendaAtualizada) => {
            this.snackBar.open('Encomenda CANCELADA', 'OK', { duration: 2000 });
            this.atualizarEncomendaNaLista(encomendaAtualizada);
          },
          error: (err) => this.snackBar.open('Erro ao cancelar encomenda.', 'Fechar', { duration: 5000 })
        });
      }
    }
  }

  private atualizarEncomendaNaLista(encomendaAtualizada: EncomendaResponse): void {
    const encomendasAtuais = this.encomendasSubject.getValue();
    const index = encomendasAtuais.findIndex(e => e.id === encomendaAtualizada.id);

    if (index !== -1) {
      encomendasAtuais[index] = encomendaAtualizada;
      this.encomendasSubject.next([...encomendasAtuais]);
    }
  }

  verDetalhes(encomenda: EncomendaResponse): void {
    this.dialog.open(EncomendaDetalheDialog, {
      width: '600px',
      data: encomenda
    });
  }

  removerEncomenda(encomenda: EncomendaResponse): void {
    if (confirm(`Tem certeza que deseja REMOVER DEFINITIVAMENTE a encomenda de "${encomenda.cliente.nome}"?`)) {
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

  public trackPorId(index: number, item: EncomendaResponse): string {
    return item.id;
  }
}
