import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Notificacao } from '../models/notificacao.interfaces';

@Injectable({ providedIn: 'root' })
export class NotificacaoService {
  private apiUrl = `${environment.apiUrl}/notificacoes`;

  constructor(private http: HttpClient) {}

  getNotificacoes(usuarioId: number): Observable<Notificacao[]> {
    const params = new HttpParams().set('usuarioId', usuarioId.toString());
    return this.http.get<Notificacao[]>(this.apiUrl, { params });
  }

  getContadorNaoLidas(usuarioId: number): Observable<number> {
    const params = new HttpParams().set('usuarioId', usuarioId.toString());
    return this.http.get<number>(`${this.apiUrl}/count`, { params });
  }

  enviarNotificacao(payload: {
    equipeId: string;
    destinatarioId?: number | null;
    remetenteId: number;
    titulo: string;
    mensagem: string;
  }): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/enviar`, payload);
  }

  marcarLida(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/ler`, {});
  }

  marcarTodasLidas(usuarioId: number): Observable<void> {
    const params = new HttpParams().set('usuarioId', usuarioId.toString());
    return this.http.post<void>(`${this.apiUrl}/ler-todas`, {}, { params });
  }
}
