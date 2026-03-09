import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Notificacao } from '../models/notificacao.interfaces';

@Injectable({ providedIn: 'root' })
export class NotificacaoService {
  private apiUrl = `${environment.apiUrl}/notificacoes`;

  private readonly NOTIFICACOES_TTL = 30_000;
  private readonly CONTADOR_TTL = 15_000;

  private cache: {
    notificacoes?: { data: Notificacao[]; timestamp: number };
    contador?: { data: number; timestamp: number };
  } = {};

  constructor(private http: HttpClient) {}

  private invalidateCache(): void {
    this.cache = {};
  }

  getNotificacoes(usuarioId: number): Observable<Notificacao[]> {
    const now = Date.now();
    if (this.cache.notificacoes && (now - this.cache.notificacoes.timestamp) < this.NOTIFICACOES_TTL) {
      return of(this.cache.notificacoes.data);
    }
    const params = new HttpParams().set('usuarioId', usuarioId.toString());
    return this.http.get<Notificacao[]>(this.apiUrl, { params }).pipe(
      tap(data => { this.cache.notificacoes = { data, timestamp: Date.now() }; })
    );
  }

  getContadorNaoLidas(usuarioId: number): Observable<number> {
    const now = Date.now();
    if (this.cache.contador && (now - this.cache.contador.timestamp) < this.CONTADOR_TTL) {
      return of(this.cache.contador.data);
    }
    const params = new HttpParams().set('usuarioId', usuarioId.toString());
    return this.http.get<number>(`${this.apiUrl}/count`, { params }).pipe(
      tap(data => { this.cache.contador = { data, timestamp: Date.now() }; })
    );
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
    this.invalidateCache();
    return this.http.post<void>(`${this.apiUrl}/${id}/ler`, {});
  }

  marcarTodasLidas(usuarioId: number): Observable<void> {
    this.invalidateCache();
    const params = new HttpParams().set('usuarioId', usuarioId.toString());
    return this.http.post<void>(`${this.apiUrl}/ler-todas`, {}, { params });
  }

  limparNotificacoes(usuarioId: number): Observable<void> {
    this.invalidateCache();
    const params = new HttpParams().set('usuarioId', usuarioId.toString());
    return this.http.delete<void>(`${this.apiUrl}/limpar`, { params });
  }
}
