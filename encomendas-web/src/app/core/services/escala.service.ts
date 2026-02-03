import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EscalaReplicacao, EscalaTrabalho } from '../models/escala.interfaces';

@Injectable({
  providedIn: 'root'
})
export class EscalaService {
  private apiUrl = `${environment.apiUrl}/escala`;

  constructor(private http: HttpClient) {}

  getEscalas(usuarioId: number, inicio: string, fim: string): Observable<EscalaTrabalho[]> {
    const params = new HttpParams()
      .set('usuarioId', usuarioId.toString())
      .set('inicio', inicio)
      .set('fim', fim);

    return this.http.get<EscalaTrabalho[]>(this.apiUrl, { params });
  }

  salvarEscala(escala: EscalaTrabalho): Observable<EscalaTrabalho> {
    return this.http.post<EscalaTrabalho>(this.apiUrl, escala);
  }

  // Novo método
  replicarEscala(dto: EscalaReplicacao): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/replicar`, dto);
  }
}
