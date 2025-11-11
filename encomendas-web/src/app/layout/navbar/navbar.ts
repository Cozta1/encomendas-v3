import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

// Módulos necessários para o HTML
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

// Caminhos corretos dos serviços
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/theme/theme.service';
import { TeamService, Equipe } from '../../core/team/team.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar implements OnInit {

  public equipes$!: Observable<Equipe[]>;
  public isDark$!: Observable<boolean>;

  constructor(
    private authService: AuthService,
    // Deixamos público para o HTML acessar o equipeAtiva$
    public teamService: TeamService,
    private themeService: ThemeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.equipes$ = this.teamService.fetchEquipesDoUsuario();
    this.isDark$ = this.themeService.isDark$;
  }

  // *** ESTA É A CORREÇÃO ***
  selecionarEquipe(equipe: Equipe): void {
    this.teamService.selecionarEquipe(equipe);
    // REMOVEMOS O window.location.reload()
    // O BehaviorSubject no serviço vai atualizar o nome no botão instantaneamente.
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
