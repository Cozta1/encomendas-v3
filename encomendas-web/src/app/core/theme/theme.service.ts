import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  private readonly THEME_KEY = 'dark-theme';
  private readonly DARK_CLASS = 'dark-theme';

  // 1. BehaviorSubject privado para o estado
  private isDarkSubject = new BehaviorSubject<boolean>(false);

  // 2. Observable público
  public isDark$ = this.isDarkSubject.asObservable();

  constructor() {
    // 3. Verifica o localStorage no construtor
    const savedState = localStorage.getItem(this.THEME_KEY);
    const initialState = savedState === 'true'; // Converte string 'true' para boolean true

    this.isDarkSubject.next(initialState);
    this.applyTheme(initialState);
  }

  /**
   * Alterna o estado do tema (claro/escuro).
   */
  toggleTheme(): void {
    const currentState = this.isDarkSubject.getValue();
    const newState = !currentState;

    // Atualiza o Subject
    this.isDarkSubject.next(newState);

    // Salva no localStorage
    localStorage.setItem(this.THEME_KEY, String(newState));

    // Aplica a classe no body
    this.applyTheme(newState);
  }

  /**
   * Adiciona ou remove a classe .dark-theme do <body>.
   */
  private applyTheme(isDark: boolean): void {
    if (isDark) {
      document.body.classList.add(this.DARK_CLASS);
    } else {
      document.body.classList.remove(this.DARK_CLASS);
    }
  }

  /**
   * Retorna o valor atual (snapshot) do estado do tema.
   */
  isCurrentlyDark(): boolean {
    return this.isDarkSubject.getValue();
  }
}
