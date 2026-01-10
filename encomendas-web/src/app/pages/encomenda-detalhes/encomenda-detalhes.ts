import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Observable, switchMap } from 'rxjs';
import { EncomendaService } from '../../core/services/encomenda.service';
import { EncomendaResponse, EncomendaHistorico } from '../../core/models/encomenda.interfaces';

// Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-encomenda-detalhes',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatButtonModule,
    MatIconModule, MatStepperModule, MatTableModule, MatDividerModule, MatSnackBarModule
  ],
  templateUrl: './encomenda-detalhes.html',
  styleUrls: ['./encomenda-detalhes.scss']
})
export class EncomendaDetalhesComponent implements OnInit {

  encomenda$!: Observable<EncomendaResponse>;

  constructor(
    private route: ActivatedRoute,
    private encomendaService: EncomendaService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Carrega a encomenda baseada no ID da URL
    this.encomenda$ = this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (id) {
          // Precisamos adicionar o método getById no service se não existir
          // Por enquanto, vou simular usando o getEncomendas() e filtrando (ideal é ter endpoint específico)
          // Na prática real: return this.encomendaService.getEncomendaById(id);

          // Como paliativo se o backend não tiver getById, usamos a lista:
          // return this.encomendaService.getEncomendas().pipe(
          //   map(lista => lista.find(e => e.id === id)!)
          // );

          // Vou assumir que você criará o endpoint ou usará o filtro:
          return this.encomendaService.getEncomendaById(id);
        }
        throw new Error('ID não fornecido');
      })
    );
  }

  // --- Helpers de Visualização ---

  getStepIndex(status: string): number {
    switch(status) {
      case 'Encomenda Criada': return 0;
      case 'Mercadoria em Loja': return 1;
      case 'Aguardando Entrega': return 2;
      case 'Concluído': return 3;
      default: return 0;
    }
  }

  getHistoricoInfo(encomenda: EncomendaResponse, statusAlvo: string): EncomendaHistorico | undefined {
    if (!encomenda.historico) return undefined;
    // Encontra a última vez que esse status foi registrado
    return encomenda.historico
      .filter(h => h.status === statusAlvo)
      .sort((a, b) => new Date(b.dataAlteracao).getTime() - new Date(a.dataAlteracao).getTime())[0];
  }

  verificarAtraso(encomenda: EncomendaResponse): boolean {
    if (!encomenda.dataEstimadaEntrega || encomenda.status === 'Concluído' || encomenda.status === 'Cancelado') return false;
    return new Date(encomenda.dataEstimadaEntrega) < new Date();
  }

  // --- Ações ---

  avancar(encomenda: EncomendaResponse) {
    this.encomendaService.avancarEtapa(encomenda.id).subscribe({
      next: () => {
        this.snackBar.open('Status atualizado!', 'OK', { duration: 2000 });
        this.ngOnInit(); // Recarrega
      },
      error: () => this.snackBar.open('Erro ao atualizar.', 'Fechar')
    });
  }

  cancelar(encomenda: EncomendaResponse) {
    if(confirm('Deseja realmente cancelar?')) {
      this.encomendaService.cancelarEncomenda(encomenda.id).subscribe({
        next: () => {
          this.snackBar.open('Encomenda cancelada.', 'OK', { duration: 2000 });
          this.ngOnInit();
        }
      });
    }
  }
}
