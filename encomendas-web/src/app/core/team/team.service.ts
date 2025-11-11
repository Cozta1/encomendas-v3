import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Interface baseada na entidade Equipe.java
 * O UUID é mapeado para string em JSON/TypeScript.
 */
export interface Equipe {
  id: string;
  nome: string;
  descricao?: string;
  administrador?: any; // Você pode tipar isso melhor se tiver um model Usuario
  dataCriacao: string; // LocalDateTime é serializado como string
  dataAtualizacao: string;
  ativa: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TeamService {

  private readonly API_URL = 'http://localhost:8080/api/equipes';
  private readonly TEAM_KEY = 'active_team_id';

  // BehaviorSubject para manter a equipe ativa em memória
  private equipeAtivaSubject = new BehaviorSubject<Equipe | null>(null);
  /**
   * Observable público da equipe ativa. Componentes podem se inscrever (subscribe)
   * a este observable para reagir a mudanças na equipe selecionada.
   */
  public equipeAtiva$ = this.equipeAtivaSubject.asObservable();

  constructor(private http: HttpClient) {
    // Tópico para o futuro:
    // Você pode querer carregar a equipe ativa do localStorage ao iniciar o serviço,
    // mas isso exigiria uma busca na API pelo ID salvo, pois o BehaviorSubject
    // precisa do objeto Equipe completo, não apenas do ID.
  }

  /**
   * Busca as equipes administradas pelo usuário logado.
   * O interceptor (auth.interceptor.ts) adicionará o token automaticamente.
   */
  fetchEquipesDoUsuario(): Observable<Equipe[]> {
    return this.http.get<Equipe[]>(this.API_URL);
  }

  /**
   * Define uma equipe como ativa na aplicação.
   * @param equipe O objeto Equipe que foi selecionado.
   */
  selecionarEquipe(equipe: Equipe): void {
    if (equipe && equipe.id) {
      localStorage.setItem(this.TEAM_KEY, equipe.id);
      this.equipeAtivaSubject.next(equipe);
    }
  }

  /**
   * Limpa a seleção de equipe (ex: ao fazer logout).
   */
  limparEquipeAtiva(): void {
    localStorage.removeItem(this.TEAM_KEY);
    this.equipeAtivaSubject.next(null);
  }

  /**
   * Retorna o ID da equipe ativa salvo no localStorage.
   * Útil para saber qual equipe estava selecionada ao recarregar a página.
   */
  getEquipeAtivaId(): string | null {
    return localStorage.getItem(this.TEAM_KEY);
  }

  /**
   * Retorna o valor atual (snapshot) da equipe ativa.
   * Prefira usar o observable equipeAtiva$ quando possível.
   */
  getEquipeAtivaValor(): Equipe | null {
    return this.equipeAtivaSubject.getValue();
  }
}
