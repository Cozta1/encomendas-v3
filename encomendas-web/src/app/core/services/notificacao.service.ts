import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  // No usuarioId param — the backend derives it from the authenticated JWT principal
  getNotificacoes(): Observable<Notificacao[]> {
    const now = Date.now();
    if (this.cache.notificacoes && (now - this.cache.notificacoes.timestamp) < this.NOTIFICACOES_TTL) {
      return of(this.cache.notificacoes.data);
    }
    return this.http.get<Notificacao[]>(this.apiUrl).pipe(
      tap(data => { this.cache.notificacoes = { data, timestamp: Date.now() }; })
    );
  }

  getContadorNaoLidas(): Observable<number> {
    const now = Date.now();
    if (this.cache.contador && (now - this.cache.contador.timestamp) < this.CONTADOR_TTL) {
      return of(this.cache.contador.data);
    }
    return this.http.get<number>(`${this.apiUrl}/count`).pipe(
      tap(data => { this.cache.contador = { data, timestamp: Date.now() }; })
    );
  }

  enviarNotificacao(payload: {
    equipeId: string;
    destinatarioId?: number | null;
    titulo: string;
    mensagem: string;
  }): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/enviar`, payload);
  }

  marcarLida(id: string): Observable<void> {
    this.invalidateCache();
    return this.http.post<void>(`${this.apiUrl}/${id}/ler`, {});
  }

  marcarTodasLidas(): Observable<void> {
    this.invalidateCache();
    return this.http.post<void>(`${this.apiUrl}/ler-todas`, {});
  }

  limparNotificacoes(): Observable<void> {
    this.invalidateCache();
    return this.http.delete<void>(`${this.apiUrl}/limpar`);
  }
}
