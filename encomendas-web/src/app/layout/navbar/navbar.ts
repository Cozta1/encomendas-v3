import { Component, OnInit, Output, EventEmitter, OnDestroy, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable, Subscription, interval } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

// Material Imports
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

// Services
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/theme/theme.service';
import { TeamService, Equipe } from '../../core/team/team.service';
import { NotificacaoService } from '../../core/services/notificacao.service';
import { Notificacao } from '../../core/models/notificacao.interfaces';
import { NotificacaoDetalheDialog } from '../../components/dialogs/notificacao-detalhe-dialog/notificacao-detalhe-dialog';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatBadgeModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar implements OnInit, OnDestroy {

  @Output() menuToggle = new EventEmitter<void>();
  @ViewChild('notifTrigger') notifTrigger!: MatMenuTrigger;

  public equipes$!: Observable<Equipe[]>;
  public isDark$!: Observable<boolean>;

  public nomeUsuario: string = '';
  public isMobile: boolean = false;
  private breakpointSub: Subscription | undefined;

  // Notifications
  notificacoes: Notificacao[] = [];
  naoLidas = 0;
  private usuarioId: number | null = null;
  private pollingInterval: Subscription | undefined;

  constructor(
    private authService: AuthService,
    public teamService: TeamService,
    private themeService: ThemeService,
    private router: Router,
    private breakpointObserver: BreakpointObserver,
    private notificacaoService: NotificacaoService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.equipes$ = this.teamService.fetchEquipesDoUsuario();
    this.isDark$ = this.themeService.isDark$;

    this.breakpointSub = this.breakpointObserver.observe([
      Breakpoints.Handset,
      Breakpoints.TabletPortrait
    ]).subscribe(result => {
      this.isMobile = result.matches;
    });

    const user = this.authService.getUser();
    if (user && user.nome) {
      this.nomeUsuario = user.nome.split(' ')[0];
      this.usuarioId = user.id;
    } else {
      this.nomeUsuario = 'Usuário';
    }

    if (this.usuarioId) {
      // Poll for new notifications every 60 seconds
      this.pollingInterval = interval(60000).pipe(
        startWith(0),
        switchMap(() => this.notificacaoService.getContadorNaoLidas(this.usuarioId!))
      ).subscribe(count => {
        this.naoLidas = count;
      });
    }
  }

  ngOnDestroy(): void {
    this.breakpointSub?.unsubscribe();
    this.pollingInterval?.unsubscribe();
  }

  carregarNotificacoes() {
    if (!this.usuarioId) return;
    // Force overlay reposition after CSS panelClass has been applied (fixes off-screen on first open)
    setTimeout(() => this.notifTrigger?.updatePosition(), 0);
    this.notificacaoService.getNotificacoes(this.usuarioId).subscribe(lista => {
      this.notificacoes = lista.slice(0, 15);
    });
  }

  abrirNotificacao(n: Notificacao) {
    // Mark as read first (silently)
    if (!n.lida) {
      this.notificacaoService.marcarLida(n.id).subscribe(() => {
        n.lida = true;
        if (this.naoLidas > 0) this.naoLidas--;
      });
    }
    // Open detail dialog
    this.dialog.open(NotificacaoDetalheDialog, {
      data: n,
      width: '540px',
      maxWidth: '96vw'
    });
  }

  marcarTodasLidas() {
    if (!this.usuarioId) return;
    this.notificacaoService.marcarTodasLidas(this.usuarioId).subscribe(() => {
      this.notificacoes.forEach(n => n.lida = true);
      this.naoLidas = 0;
    });
  }

  onMenuClick(): void {
    this.menuToggle.emit();
  }

  selecionarEquipe(equipe: Equipe): void {
    this.teamService.selecionarEquipe(equipe);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
