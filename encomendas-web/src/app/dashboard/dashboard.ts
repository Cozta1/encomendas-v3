import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common'; // Necessário para | async, | currency, etc.
import { Router, RouterModule } from '@angular/router'; // Importar RouterModule
import { BehaviorSubject, Subscription, map, skip } from 'rxjs';
import { EncomendaResponse } from '../core/models/encomenda.interfaces';
import { EncomendaService } from '../core/services/encomenda.service';
import { TeamService } from '../core/team/team.service';

// Importações do Angular Material
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-dashboard',
  standalone: true, // Garante que o componente é standalone
  imports: [
    CommonModule,
    RouterModule, // Adicionado para routerLink
    MatGridListModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatChipsModule,
    MatButtonModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit, OnDestroy {

  private teamSubscription: Subscription | undefined;

  // Subject principal que armazena todas as encomendas
  private encomendasSubject = new BehaviorSubject<EncomendaResponse[]>([]);

  // Observables derivados para as métricas
  public totalVendidoMes$ = new BehaviorSubject<number>(0);
  public totalVendidoSemana$ = new BehaviorSubject<number>(0);
  public contagemPedidosMes$ = new BehaviorSubject<number>(0);
  public contagemPedidosSemana$ = new BehaviorSubject<number>(0);

  // Observable para a tabela
  public ultimasEncomendasAbertas$ = new BehaviorSubject<EncomendaResponse[]>([]);
  public displayedColumns: string[] = ['data', 'cliente', 'status', 'valorTotal', 'acoes'];

  constructor(
    private encomendaService: EncomendaService,
    private teamService: TeamService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Carrega os dados na primeira vez
    this.carregarDadosDashboard();

    // Ouve mudanças na equipe (ignora a primeira, pois já carregamos)
    this.teamSubscription = this.teamService.equipeAtiva$.pipe(skip(1)).subscribe(() => {
      this.carregarDadosDashboard();
    });
  }

  ngOnDestroy(): void {
    this.teamSubscription?.unsubscribe();
  }

  /**
   * Busca todas as encomendas e dispara o processamento.
   */
  carregarDadosDashboard(): void {
    this.encomendaService.getEncomendas().subscribe(data => {
      this.encomendasSubject.next(data);
      this.processarMetricas(data);
      this.processarEncomendasAbertas(data);
    });
  }

  /**
   * Calcula as métricas de vendas e contagem dos últimos 7 e 30 dias.
   */
  private processarMetricas(encomendas: EncomendaResponse[]): void {
    const agora = new Date();
    const inicioSemana = new Date(agora);
    inicioSemana.setDate(agora.getDate() - 7);
    const inicioMes = new Date(agora);
    inicioMes.setDate(agora.getDate() - 30);

    let totalSemana = 0;
    let totalMes = 0;
    let countSemana = 0;
    let countMes = 0;

    // ======================================
    // === LÓGICA ATUALIZADA AQUI ===
    // ======================================
    const encomendasConcluidas = encomendas.filter(e => e.status === 'Concluído');

    for (const enc of encomendasConcluidas) {
      const dataEncomenda = new Date(enc.dataCriacao);

      if (dataEncomenda >= inicioMes) {
        totalMes += enc.valorTotal;
        countMes++;
      }
      if (dataEncomenda >= inicioSemana) {
        totalSemana += enc.valorTotal;
        countSemana++;
      }
    }

    this.totalVendidoMes$.next(totalMes);
    this.totalVendidoSemana$.next(totalSemana);
    this.contagemPedidosMes$.next(countMes);
    this.contagemPedidosSemana$.next(countSemana);
  }

  /**
   * Filtra as 5 encomendas abertas mais recentes.
   */
  private processarEncomendasAbertas(encomendas: EncomendaResponse[]): void {

    // ======================================
    // === LÓGICA ATUALIZADA AQUI ===
    // ======================================
    const encomendasAbertas = encomendas
      .filter(e => e.status !== 'Concluído' && e.status !== 'Cancelado') // (Esta lógica já está correta)
      .sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime()) // Mais recentes primeiro
      .slice(0, 5); // Pega apenas as 5 primeiras

    this.ultimasEncomendasAbertas$.next(encomendasAbertas);
  }

  // ======================================
  // === LÓGICA ATUALIZADA AQUI ===
  // ======================================
  // Helper para cor do chip de status
  public getStatusColor(status: string): 'primary' | 'accent' | 'warn' {
    switch (status) {
      case 'Concluído': return 'primary';
      case 'Em Preparo': return 'accent';
      case 'Aguardando Entrega': return 'accent'; // <-- NOVO (usando 'accent' também)
      case 'Aguardando': return 'warn';
      default: return 'primary'; // 'Cancelado' usará 'primary' mas com CSS cinza
    }
  }
  // ======================================

  // Navega para a página de encomendas
  public irParaEncomendas(): void {
    this.router.navigate(['/encomendas']);
  }
}
