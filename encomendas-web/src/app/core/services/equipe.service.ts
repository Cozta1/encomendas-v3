import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MembroEquipe {
  id: number;
  nomeCompleto: string;
  email: string;
  cargo: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class EquipeService {
  private apiUrl = `${environment.apiUrl}/equipes`;

  constructor(private http: HttpClient) {}

  listarMembros(): Observable<MembroEquipe[]> {
    return this.http.get<MembroEquipe[]>(`${this.apiUrl}/membros`);
  }

  /**
   * Remove um membro da equipe (apenas admins podem fazer isso).
   */
  removerMembro(usuarioId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/membros/${usuarioId}`);
  }
}
