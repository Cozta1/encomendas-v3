import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

export interface Equipe {
  id: string;
  nome: string;
  descricao?: string;
  nomeAdministrador?: string;
  isAdmin?: boolean;
}

export interface Convite {
  id: string;
  emailDestino: string;
  status: string;
  equipe: Equipe;
}

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private readonly API_URL = 'http://localhost:8080/api/equipes';
  private readonly STORAGE_KEY = 'active_team_id';

  private equipeAtivaSubject = new BehaviorSubject<Equipe | null>(null);
  public equipeAtiva$ = this.equipeAtivaSubject.asObservable();

  constructor(private http: HttpClient) {
    this.carregarEquipeAtivaDoStorage();
  }

  public getEquipeAtivaId(): string | null {
    return localStorage.getItem(this.STORAGE_KEY);
  }

  public fetchEquipesDoUsuario(): Observable<Equipe[]> {
    return this.http.get<Equipe[]>(this.API_URL);
  }

  public criarEquipe(dados: { nome: string, descricao: string }): Observable<Equipe> {
    return this.http.post<Equipe>(this.API_URL, dados);
  }

  // --- MÉTODOS DE CONVITE ---

  /**
   * Envia um convite por email.
   * Usa responseType: 'text' porque o backend retorna uma String simples.
   */
  public enviarConvite(equipeId: string, email: string): Observable<any> {
    return this.http.post(
      `${this.API_URL}/${equipeId}/convidar`,
      { email },
      { responseType: 'text' as 'json' }
    );
  }

  public listarConvitesEnviados(equipeId: string): Observable<Convite[]> {
    return this.http.get<Convite[]>(`${this.API_URL}/${equipeId}/convites`);
  }

  public listarMeusConvitesPendentes(): Observable<Convite[]> {
    return this.http.get<Convite[]>(`${this.API_URL}/meus-convites`);
  }

  /**
   * Aceita um convite pendente.
   * Usa responseType: 'text' porque o backend retorna uma String simples.
   */
  public aceitarConvite(conviteId: string): Observable<any> {
    return this.http.post(
      `${this.API_URL}/convites/${conviteId}/aceitar`,
      {},
      { responseType: 'text' as 'json' }
    );
  }

  // --- GESTÃO DE ESTADO (EQUIPE ATIVA) ---

  public selecionarEquipe(equipe: Equipe): void {
    localStorage.setItem(this.STORAGE_KEY, equipe.id);
    this.equipeAtivaSubject.next(equipe);
  }

  private carregarEquipeAtivaDoStorage(): void {
    const equipeId = this.getEquipeAtivaId();
    if (equipeId) {
      this.fetchEquipesDoUsuario().pipe(
        switchMap(equipes => of(equipes.find(e => e.id === equipeId)))
      ).subscribe(equipeEncontrada => {
        if (equipeEncontrada) {
          this.equipeAtivaSubject.next(equipeEncontrada);
        } else {
          localStorage.removeItem(this.STORAGE_KEY);
        }
      });
    }
  }
}
