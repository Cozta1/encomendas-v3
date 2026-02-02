import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EscalaTrabalho } from '../models/escala.interfaces';

@Injectable({
  providedIn: 'root'
})
export class EscalaService {
  private apiUrl = `${environment.apiUrl}/escala`;

  constructor(private http: HttpClient) {}

  // Busca escalas de um usuário em um intervalo de datas
  getEscalas(usuarioId: number, inicio: string, fim: string): Observable<EscalaTrabalho[]> {
    const params = new HttpParams()
      .set('usuarioId', usuarioId.toString())
      .set('inicio', inicio)
      .set('fim', fim);

    return this.http.get<EscalaTrabalho[]>(this.apiUrl, { params });
  }

  // Cria ou atualiza uma escala (Apenas ADM, tratado no Back)
  salvarEscala(escala: EscalaTrabalho): Observable<EscalaTrabalho> {
    return this.http.post<EscalaTrabalho>(this.apiUrl, escala);
  }
}
