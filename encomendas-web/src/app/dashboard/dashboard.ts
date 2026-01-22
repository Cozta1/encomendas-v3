import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { BehaviorSubject, Subscription } from 'rxjs'; // Removido 'skip'
import { EncomendaResponse } from '../core/models/encomenda.interfaces';
import { EncomendaService } from '../core/services/encomenda.service';
import { TeamService, Equipe } from '../core/team/team.service'; // Importe 'Equipe'
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

// Imports UI (Mantenha os imports existentes)
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatGridListModule, MatCardModule,
    MatTableModule, MatIconModule, MatChipsModule, MatButtonModule,
    MatListModule, MatDividerModule, MatProgressBarModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit, OnDestroy {

  private teamSubscription: Subscription | undefined;
  private breakpointSub: Subscription | undefined;

  public isMobile = false;
  // ... (mantenha suas variáveis de BehaviorSubject aqui)
  private encomendasSubject = new BehaviorSubject<EncomendaResponse[]>([]);
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
    private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit(): void {
    // 1. Monitora o tamanho da tela
    this.breakpointSub = this.breakpointObserver.observe([
      Breakpoints.Handset,
      Breakpoints.TabletPortrait
    ]).subscribe(result => {
      this.isMobile = result.matches;
      this.displayedColumns = this.isMobile
        ? ['cliente', 'status', 'valorTotal', 'acoes']
        : ['data', 'cliente', 'status', 'valorTotal', 'acoes'];
    });

    // 2. Inscreve-se na equipe ativa. Isso roda no início E quando muda a equipe.
    this.teamSubscription = this.teamService.equipeAtiva$.subscribe((equipe) => {
      if (equipe) {
        // Se tem equipe, carrega os dados
        this.carregarDadosDashboard();
      } else {
        // Se NÃO tem equipe (login novo), tenta selecionar automaticamente
        this.autoSelecionarEquipe();
      }
    });
  }

  // Nova função para evitar o loop de 401
  private autoSelecionarEquipe(): void {
    this.teamService.fetchEquipesDoUsuario().subscribe({
      next: (equipes) => {
        if (equipes && equipes.length > 0) {
          // Seleciona a primeira equipe encontrada
          this.teamService.selecionarEquipe(equipes[0]);
          // A seleção vai disparar o 'teamSubscription' acima, que chamará o 'carregarDadosDashboard'
        } else {
          // Se o usuário não tem nenhuma equipe, redirecione para criar uma
          this.router.navigate(['/equipes']);
        }
      },
      error: (err) => {
        console.error('Erro ao buscar equipes', err);
        // Se falhar ao buscar equipes, aí sim pode ser token inválido
      }
    });
  }

  ngOnDestroy(): void {
    this.teamSubscription?.unsubscribe();
    this.breakpointSub?.unsubscribe();
  }

  carregarDadosDashboard(): void {
    // Só chama o backend se tiver equipe selecionada (redundância de segurança)
    if (!this.teamService.getEquipeAtivaId()) return;

    this.encomendaService.getEncomendas().subscribe({
      next: (data) => {
        this.encomendasSubject.next(data);
        this.processarMetricas(data);
        this.processarEncomendasAbertas(data);
      },
      error: (err) => console.error('Erro ao carregar dashboard:', err)
    });
  }

  // ... (Mantenha os métodos processarMetricas, processarEncomendasAbertas, getStatusColor, etc. iguais)
  private processarMetricas(encomendas: EncomendaResponse[]): void {
     // ... seu código original ...
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
    this.router.navigate(['/encomendas', encomenda.id]);
  }
}
