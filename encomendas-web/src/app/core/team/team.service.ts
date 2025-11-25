import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

export interface Equipe {
  id: string;
  nome: string;
  descricao?: string;
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

  // --- NOVO MÉTODO ---
  public criarEquipe(dados: { nome: string, descricao: string }): Observable<Equipe> {
    return this.http.post<Equipe>(this.API_URL, dados);
  }

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
