import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { BehaviorSubject, Subscription, skip } from 'rxjs';
import { EncomendaResponse } from '../core/models/encomenda.interfaces';
import { EncomendaService } from '../core/services/encomenda.service';
import { TeamService } from '../core/team/team.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout'; // Importar

import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatGridListModule, MatCardModule,
    MatTableModule, MatIconModule, MatChipsModule, MatButtonModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit, OnDestroy {

  private teamSubscription: Subscription | undefined;
  private breakpointSub: Subscription | undefined;

  // Controle da Grid
  public gridCols = 4;
  public tableColspan = 4; // Tabela ocupa tudo

  // Dados (igual ao original)
  private encomendasSubject = new BehaviorSubject<EncomendaResponse[]>([]);
  public totalVendidoMes$ = new BehaviorSubject<number>(0);
  public totalVendidoSemana$ = new BehaviorSubject<number>(0);
  public contagemPedidosMes$ = new BehaviorSubject<number>(0);
  public contagemPedidosSemana$ = new BehaviorSubject<number>(0);
  public ultimasEncomendasAbertas$ = new BehaviorSubject<EncomendaResponse[]>([]);
  public displayedColumns: string[] = ['data', 'cliente', 'status', 'valorTotal', 'acoes'];

  constructor(
    private encomendaService: EncomendaService,
    private teamService: TeamService,
    private router: Router,
    private breakpointObserver: BreakpointObserver // Injetar
  ) {}

  ngOnInit(): void {
    this.carregarDadosDashboard();

    // Responsividade da Grid
    this.breakpointSub = this.breakpointObserver.observe([
      Breakpoints.Handset,
      Breakpoints.Tablet
    ]).subscribe(result => {
      if (result.breakpoints[Breakpoints.Handset]) {
        // Celular: 1 coluna, tabela ocupa 1
        this.gridCols = 1;
        this.tableColspan = 1;
      } else if (result.breakpoints[Breakpoints.Tablet]) {
        // Tablet: 2 colunas, tabela ocupa 2
        this.gridCols = 2;
        this.tableColspan = 2;
      } else {
        // Desktop: 4 colunas, tabela ocupa 4
        this.gridCols = 4;
        this.tableColspan = 4;
      }
    });

    this.teamSubscription = this.teamService.equipeAtiva$.pipe(skip(1)).subscribe(() => {
      this.carregarDadosDashboard();
    });
  }

  ngOnDestroy(): void {
    this.teamSubscription?.unsubscribe();
    this.breakpointSub?.unsubscribe();
  }

  // ... (manter restante dos métodos: carregarDadosDashboard, processarMetricas, etc.) ...
  carregarDadosDashboard(): void {
    this.encomendaService.getEncomendas().subscribe(data => {
      this.encomendasSubject.next(data);
      this.processarMetricas(data);
      this.processarEncomendasAbertas(data);
    });
  }

  private processarMetricas(encomendas: EncomendaResponse[]): void {
     // (Código original de métricas)
     const agora = new Date();
     const inicioSemana = new Date(agora);
     inicioSemana.setDate(agora.getDate() - 7);
     const inicioMes = new Date(agora);
     inicioMes.setDate(agora.getDate() - 30);
     let totalSemana = 0; let totalMes = 0; let countSemana = 0; let countMes = 0;
     const encomendasConcluidas = encomendas.filter(e => e.status === 'Concluído');
     for (const enc of encomendasConcluidas) {
       const dataEncomenda = new Date(enc.dataCriacao);
       if (dataEncomenda >= inicioMes) { totalMes += enc.valorTotal; countMes++; }
       if (dataEncomenda >= inicioSemana) { totalSemana += enc.valorTotal; countSemana++; }
     }
     this.totalVendidoMes$.next(totalMes);
     this.totalVendidoSemana$.next(totalSemana);
     this.contagemPedidosMes$.next(countMes);
     this.contagemPedidosSemana$.next(countSemana);
  }

  private processarEncomendasAbertas(encomendas: EncomendaResponse[]): void {
    const encomendasAbertas = encomendas
      .filter(e => e.status !== 'Concluído' && e.status !== 'Cancelado')
      .sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime())
      .slice(0, 5);
    this.ultimasEncomendasAbertas$.next(encomendasAbertas);
  }

  public getStatusColor(status: string): 'primary' | 'accent' | 'warn' {
    switch (status) {
      case 'Concluído': return 'primary';
      case 'Em Preparo': return 'accent';
      case 'Aguardando Entrega': return 'accent';
      case 'Pendente': return 'warn';
      default: return 'primary';
    }
  }

  public irParaEncomendas(): void {
    this.router.navigate(['/encomendas']);
  }
}
