import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Interface ajustada para bater com o DTO do Backend e a Entidade Usuario original
export interface MembroEquipe {
  id: number;           // Backend é Long (numérico)
  nomeCompleto: string; // Backend usa 'nomeCompleto'
  email: string;
  cargo: string;        // Novo campo
  role: string;         // ROLE_ADMIN, ROLE_USER, etc.
}

@Injectable({
  providedIn: 'root'
})
export class EquipeService {
  private apiUrl = `${environment.apiUrl}/equipes`;

  constructor(private http: HttpClient) {}

  /**
   * Lista todos os membros da equipe ativa.
   */
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
