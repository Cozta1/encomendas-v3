import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { BehaviorSubject, Subscription, skip } from 'rxjs';
import { EncomendaResponse } from '../core/models/encomenda.interfaces';
import { EncomendaService } from '../core/services/encomenda.service';
import { TeamService } from '../core/team/team.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

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

  // Variável principal para controlar o layout
  public isMobile = false;

  // Dados da Lista
  private encomendasSubject = new BehaviorSubject<EncomendaResponse[]>([]);

  // NOVAS MÉTRICAS
  public totalBrutoMes$ = new BehaviorSubject<number>(0);   // Pendentes + Concluídos (não cancelados)
  public totalLiquidoMes$ = new BehaviorSubject<number>(0); // Apenas Concluídos
  public contagemPedidosMes$ = new BehaviorSubject<number>(0);

  // Mantemos a lista de últimas abertas
  public ultimasEncomendasAbertas$ = new BehaviorSubject<EncomendaResponse[]>([]);

  // Colunas da tabela
  public displayedColumns: string[] = ['data', 'cliente', 'status', 'valorTotal', 'acoes'];

  constructor(
    private encomendaService: EncomendaService,
    private teamService: TeamService,
    private router: Router,
    private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit(): void {
    this.carregarDadosDashboard();

    // Detecta mudança de tela
    this.breakpointSub = this.breakpointObserver.observe([
      Breakpoints.Handset,
      Breakpoints.TabletPortrait
    ]).subscribe(result => {
      this.isMobile = result.matches;

      if (this.isMobile) {
        this.displayedColumns = ['cliente', 'status', 'acoes'];
      } else {
        this.displayedColumns = ['data', 'cliente', 'status', 'valorTotal', 'acoes'];
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

  carregarDadosDashboard(): void {
    this.encomendaService.getEncomendas().subscribe(data => {
      this.encomendasSubject.next(data);
      this.processarMetricas(data);
      this.processarEncomendasAbertas(data);
    });
  }

  private processarMetricas(encomendas: EncomendaResponse[]): void {
     const agora = new Date();
     const inicioMes = new Date(agora);
     inicioMes.setDate(agora.getDate() - 30); // Últimos 30 dias

     let somaBruto = 0;
     let somaLiquido = 0;
     let countMes = 0;

     for (const enc of encomendas) {
       const dataEncomenda = new Date(enc.dataCriacao);

       // Filtra apenas os últimos 30 dias
       if (dataEncomenda >= inicioMes) {

         // Se não estiver cancelado, entra no Total Bruto (Potencial de venda)
         if (enc.status !== 'Cancelado') {
            somaBruto += enc.valorTotal;
            countMes++; // Contamos quantos pedidos ativos houve no mês
         }

         // Apenas Concluídos entram no Total Líquido (Dinheiro em caixa)
         if (enc.status === 'Concluído') {
            somaLiquido += enc.valorTotal;
         }
       }
     }

     this.totalBrutoMes$.next(somaBruto);
     this.totalLiquidoMes$.next(somaLiquido);
     this.contagemPedidosMes$.next(countMes);
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
