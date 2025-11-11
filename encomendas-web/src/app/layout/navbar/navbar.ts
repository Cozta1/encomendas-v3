import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

// Módulos necessários para o HTML
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

// CORREÇÃO DOS CAMINHOS DOS SERVIÇOS
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/theme/theme.service';
import { TeamService, Equipe } from '../../core/team/team.service';

@Component({
  selector: 'app-navbar',
  standalone: true, // <--- CORREÇÃO: ADICIONA ISTO
  imports: [
    // ADICIONA OS MÓDULOS QUE O HTML USA
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
    private teamService: TeamService,
    private themeService: ThemeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.equipes$ = this.teamService.fetchEquipesDoUsuario();
    this.isDark$ = this.themeService.isDark$;
  }

  selecionarEquipa(equipa: Equipe): void {
    this.teamService.selecionarEquipa(equipa);
    window.location.reload(); // Recarrega para atualizar o contexto
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
