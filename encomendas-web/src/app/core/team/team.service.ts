import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, find, switchMap } from 'rxjs/operators';

// Interface que movemos para cá (ou para um arquivo de models)
export interface Equipe {
  id: string;
  nome: string;
  // Adicione outros campos se precisar (ex: descricao)
}

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private readonly API_URL = 'http://localhost:8080/api/equipes';
  private readonly STORAGE_KEY = 'active_team_id';

  // BehaviorSubject guarda o valor atual e emite para quem estiver ouvindo
  private equipeAtivaSubject = new BehaviorSubject<Equipe | null>(null);
  public equipeAtiva$ = this.equipeAtivaSubject.asObservable();

  constructor(private http: HttpClient) {
    // *** ESTA É A MÁGICA ***
    // Ao iniciar o serviço, carrega a equipe do localStorage
    this.carregarEquipeAtivaDoStorage();
  }

  // Busca o ID salvo no localStorage
  public getEquipeAtivaId(): string | null {
    return localStorage.getItem(this.STORAGE_KEY);
  }

  // Busca as equipes do usuário (o interceptor adiciona o token)
  public fetchEquipesDoUsuario(): Observable<Equipe[]> {
    return this.http.get<Equipe[]>(this.API_URL);
  }

  // Define uma equipe como ativa
  public selecionarEquipe(equipe: Equipe): void {
    localStorage.setItem(this.STORAGE_KEY, equipe.id);
    this.equipeAtivaSubject.next(equipe); // Emite a nova equipe para todos os "ouvintes"
  }

  // Método privado que roda quando a aplicação carrega
  private carregarEquipeAtivaDoStorage(): void {
    const equipeId = this.getEquipeAtivaId();
    if (equipeId) {
      // Se achamos um ID, precisamos buscar os detalhes da equipe (como o nome)
      // Usamos a lista de equipes do usuário para encontrar a equipe correta
      this.fetchEquipesDoUsuario().pipe(
        switchMap(equipes => of(equipes.find(e => e.id === equipeId)))
      ).subscribe(equipeEncontrada => {
        if (equipeEncontrada) {
          this.equipeAtivaSubject.next(equipeEncontrada);
        } else {
          // O ID salvo era inválido (ex: equipe foi deletada), limpamos
          localStorage.removeItem(this.STORAGE_KEY);
        }
      });
    }
  }
}
