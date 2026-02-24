import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { BehaviorSubject, Subscription } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { EncomendaResponse } from '../core/models/encomenda.interfaces';
import { EncomendaService } from '../core/services/encomenda.service';
import { TeamService } from '../core/team/team.service';
import { AuthService } from '../core/auth/auth.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { EnviarNotificacaoDialog } from '../components/dialogs/enviar-notificacao-dialog/enviar-notificacao-dialog';

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
import { MatDialogModule } from '@angular/material/dialog';

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
  public isAdmin = false;

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
    private authService: AuthService,
    private router: Router,
    private breakpointObserver: BreakpointObserver,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();

    this.breakpointSub = this.breakpointObserver.observe([
      Breakpoints.Handset,
      Breakpoints.TabletPortrait
    ]).subscribe(result => {
      this.isMobile = result.matches;
      this.displayedColumns = this.isMobile
        ? ['cliente', 'status', 'valorTotal', 'acoes']
        : ['data', 'cliente', 'status', 'valorTotal', 'acoes'];
    });

    this.teamSubscription = this.teamService.equipeAtiva$.pipe(
      distinctUntilChanged((a, b) => a?.id === b?.id)
    ).subscribe((equipe) => {
      if (equipe) {
        this.carregarDadosDashboard();
      } else {
        this.autoSelecionarEquipe();
      }
    });
  }

  private autoSelecionarEquipe(): void {
    this.teamService.fetchEquipesDoUsuario().subscribe({
      next: (equipes) => {
        if (equipes && equipes.length > 0) {
          this.teamService.selecionarEquipe(equipes[0]);
        } else {
          this.router.navigate(['/equipes']);
        }
      },
      error: (err) => {
        console.error('Erro ao buscar equipes', err);
      }
    });
  }

  ngOnDestroy(): void {
    this.teamSubscription?.unsubscribe();
    this.breakpointSub?.unsubscribe();
  }

  carregarDadosDashboard(): void {
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

  public abrirEnviarNotificacao(): void {
    const equipeId = this.teamService.getEquipeAtivaId();
    const user = this.authService.getUser();
    if (!equipeId || !user) return;

    this.teamService.getMembros(equipeId).subscribe({
      next: (membros) => {
        const outrosMembros = membros.filter(m => m.id !== user.id);
        this.dialog.open(EnviarNotificacaoDialog, {
          data: { equipeId, remetenteId: user.id, membros: outrosMembros },
          width: '460px'
        });
      },
      error: () => {}
    });
  }

  public irParaEncomendas(): void {
    this.router.navigate(['/encomendas']);
  }

  public verDetalhes(encomenda: EncomendaResponse): void {
    this.router.navigate(['/encomendas', encomenda.id]);
  }
}