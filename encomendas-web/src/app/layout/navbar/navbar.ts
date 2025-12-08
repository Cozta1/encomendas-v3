import { Component, OnInit, Output, EventEmitter } from '@angular/core'; // Adicionar Output, EventEmitter
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
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

  // Evento para avisar ao Main que o botão foi clicado
  @Output() menuToggle = new EventEmitter<void>();

  public equipes$!: Observable<Equipe[]>;
  public isDark$!: Observable<boolean>;

  constructor(
    private authService: AuthService,
    public teamService: TeamService,
    private themeService: ThemeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.equipes$ = this.teamService.fetchEquipesDoUsuario();
    this.isDark$ = this.themeService.isDark$;
  }

  // Emite o evento
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
