import { Component, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable, Subscription } from 'rxjs';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

// Material Imports
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider'; // <--- IMPORTADO AQUI

// Services
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/theme/theme.service';
import { TeamService, Equipe } from '../../core/team/team.service';

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
    MatDividerModule // <--- ADICIONADO AQUI
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar implements OnInit, OnDestroy {

  @Output() menuToggle = new EventEmitter<void>();

  public equipes$!: Observable<Equipe[]>;
  public isDark$!: Observable<boolean>;

  public nomeUsuario: string = '';
  public isMobile: boolean = false;
  private breakpointSub: Subscription | undefined;

  constructor(
    private authService: AuthService,
    public teamService: TeamService,
    private themeService: ThemeService,
    private router: Router,
    private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit(): void {
    // 1. Carregar Equipes e Tema
    this.equipes$ = this.teamService.fetchEquipesDoUsuario();
    this.isDark$ = this.themeService.isDark$;

    // 2. Detectar Mobile
    this.breakpointSub = this.breakpointObserver.observe([
      Breakpoints.Handset,
      Breakpoints.TabletPortrait
    ]).subscribe(result => {
      this.isMobile = result.matches;
    });

    // 3. Obter Nome do Usuário
    const user = this.authService.getUser();
    if (user && user.nome) {
      this.nomeUsuario = user.nome.split(' ')[0];
    } else if (user && user.nome) {
      this.nomeUsuario = user.nome.split(' ')[0];
    } else {
      this.nomeUsuario = 'Usuário';
    }
  }

  ngOnDestroy(): void {
    if (this.breakpointSub) {
      this.breakpointSub.unsubscribe();
    }
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
