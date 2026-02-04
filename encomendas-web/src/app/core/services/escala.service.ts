import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EscalaTrabalho, EscalaReplicacao } from '../models/escala.interfaces';

@Injectable({
  providedIn: 'root'
})
export class EscalaService {

  // CORREÇÃO: A rota deve ser '/escalas' (plural) para bater com o Controller Java
  private apiUrl = `${environment.apiUrl}/escalas`;

  constructor(private http: HttpClient) {}

  getEscalas(usuarioId: number, inicio: string, fim: string): Observable<EscalaTrabalho[]> {
    const params = new HttpParams()
      .set('usuarioId', usuarioId.toString())
      .set('inicio', inicio)
      .set('fim', fim);

    return this.http.get<EscalaTrabalho[]>(this.apiUrl, { params });
  }

  salvarEscala(escala: EscalaTrabalho): Observable<EscalaTrabalho> {
    // POST /api/escalas
    return this.http.post<EscalaTrabalho>(this.apiUrl, escala);
  }

  replicarEscala(replicacao: EscalaReplicacao): Observable<void> {
    // POST /api/escalas/replicar
    return this.http.post<void>(`${this.apiUrl}/replicar`, replicacao);
  }
}
