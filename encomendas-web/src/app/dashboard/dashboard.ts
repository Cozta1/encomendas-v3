import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { BehaviorSubject, Subscription, skip } from 'rxjs';
import { EncomendaResponse } from '../core/models/encomenda.interfaces';
import { EncomendaService } from '../core/services/encomenda.service';
import { TeamService } from '../core/team/team.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

// Imports UI
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

// Import do Dialog de Detalhes APENAS (o de form foi removido)
import { EncomendaDetalheDialog } from '../components/dialogs/encomenda-detalhe-dialog/encomenda-detalhe-dialog';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatGridListModule, MatCardModule,
    MatTableModule, MatIconModule, MatChipsModule, MatButtonModule,
    MatListModule, MatDividerModule, MatProgressBarModule, MatDialogModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit, OnDestroy {

  private teamSubscription: Subscription | undefined;
  private breakpointSub: Subscription | undefined;

  public isMobile = false;

  private encomendasSubject = new BehaviorSubject<EncomendaResponse[]>([]);

  // Métricas
  public totalBrutoMes$ = new BehaviorSubject<number>(0);
  public totalLiquidoMes$ = new BehaviorSubject<number>(0);
  public contagemPedidosMes$ = new BehaviorSubject<number>(0);
  public ticketMedio$ = new BehaviorSubject<number>(0);

  public statusCounts$ = new BehaviorSubject<any>({ criada: 0, loja: 0, aguardando: 0, concluido: 0 });
  public encomendasAtrasadas$ = new BehaviorSubject<EncomendaResponse[]>([]);

  public ultimasEncomendasAbertas$ = new BehaviorSubject<EncomendaResponse[]>([]);
  public displayedColumns: string[] = ['data', 'cliente', 'status', 'valorTotal', 'acoes'];

  constructor(
    private encomendaService: EncomendaService,
    private teamService: TeamService,
    private router: Router,
    private breakpointObserver: BreakpointObserver,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.carregarDadosDashboard();

    this.breakpointSub = this.breakpointObserver.observe([
      Breakpoints.Handset,
      Breakpoints.TabletPortrait
    ]).subscribe(result => {
      this.isMobile = result.matches;
      if (this.isMobile) {
        this.displayedColumns = ['cliente', 'status', 'valorTotal', 'acoes'];
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
     inicioMes.setDate(agora.getDate() - 30);

     let somaBruto = 0;
     let somaLiquido = 0;
     let countMes = 0;

     const statusMap = { criada: 0, loja: 0, aguardando: 0, concluido: 0 };
     const atrasadas: EncomendaResponse[] = [];

     for (const enc of encomendas) {
       const dataEncomenda = new Date(enc.dataCriacao);

       if (dataEncomenda >= inicioMes) {
         if (enc.status !== 'Cancelado') {
            somaBruto += enc.valorTotal;
            countMes++;
         }
         if (enc.status === 'Concluído') {
            somaLiquido += enc.valorTotal;
         }
       }

       if (enc.status !== 'Cancelado') {
          switch(enc.status) {
            case 'Encomenda Criada': statusMap.criada++; break;
            case 'Mercadoria em Loja': statusMap.loja++; break;
            case 'Aguardando Entrega': statusMap.aguardando++; break;
            case 'Concluído': statusMap.concluido++; break;
            // Fallback
            case 'Pendente': statusMap.criada++; break;
            case 'Em Preparo': statusMap.loja++; break;
          }

          if (enc.status !== 'Concluído' && enc.dataEstimadaEntrega) {
             const dataEntrega = new Date(enc.dataEstimadaEntrega);
             if (dataEntrega < agora) {
               atrasadas.push(enc);
             }
          }
       }
     }

     this.totalBrutoMes$.next(somaBruto);
     this.totalLiquidoMes$.next(somaLiquido);
     this.contagemPedidosMes$.next(countMes);

     const ticket = countMes > 0 ? somaBruto / countMes : 0;
     this.ticketMedio$.next(ticket);

     this.statusCounts$.next(statusMap);

     atrasadas.sort((a, b) => {
       const da = a.dataEstimadaEntrega ? new Date(a.dataEstimadaEntrega).getTime() : 0;
       const db = b.dataEstimadaEntrega ? new Date(b.dataEstimadaEntrega).getTime() : 0;
       return da - db;
     });
     this.encomendasAtrasadas$.next(atrasadas);
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
      case 'Mercadoria em Loja': return 'accent';
      case 'Aguardando Entrega': return 'accent';
      case 'Encomenda Criada': return 'warn';
      case 'Pendente': return 'warn';
      default: return 'primary';
    }
  }

  public irParaEncomendas(): void {
    this.router.navigate(['/encomendas']);
  }

  public verDetalhes(encomenda: EncomendaResponse): void {
    this.dialog.open(EncomendaDetalheDialog, {
      width: '600px',
      data: encomenda
    });
  }
}
