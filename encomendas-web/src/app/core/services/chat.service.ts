import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
// Note: usuarioId params were removed from getConversas/marcarLida/getBadge — the backend
// now derives the user ID from the authenticated JWT principal (IDOR fix).
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import {
  Conversa,
  MensagemChat,
  EnviarMensagemRequest,
  CriarConversaRequest
} from '../models/chat.interfaces';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private apiUrl = `${environment.apiUrl}/chat`;

  private supabase: SupabaseClient | null = null;
  private channels = new Map<string, RealtimeChannel>();

  private messagesSubject = new Subject<MensagemChat>();
  public messages$ = this.messagesSubject.asObservable();

  private badgeSubject = new BehaviorSubject<number>(0);
  public badge$ = this.badgeSubject.asObservable();

  private _activeConversaId: string | null = null;

  constructor(private http: HttpClient) {}

  // ---- REST ----

  getConversas(equipeId: string): Observable<Conversa[]> {
    const params = new HttpParams().set('equipeId', equipeId);
    return this.http.get<Conversa[]>(`${this.apiUrl}/conversas`, { params });
  }

  criarConversa(req: CriarConversaRequest): Observable<{ id: string; tipo: string }> {
    return this.http.post<{ id: string; tipo: string }>(`${this.apiUrl}/conversas`, req);
  }

  getMensagens(conversaId: string, page: number = 0): Observable<MensagemChat[]> {
    const params = new HttpParams()
      .set('conversaId', conversaId)
      .set('page', page.toString());
    return this.http.get<MensagemChat[]>(`${this.apiUrl}/mensagens`, { params });
  }

  enviarMensagem(req: EnviarMensagemRequest): Observable<MensagemChat> {
    return this.http.post<MensagemChat>(`${this.apiUrl}/mensagens/enviar`, req);
  }

  marcarLida(conversaId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/mensagens/${conversaId}/lida`, {});
  }

  getBadge(equipeId: string): Observable<number> {
    const params = new HttpParams().set('equipeId', equipeId);
    return this.http.get<number>(`${this.apiUrl}/badge`, { params });
  }

  // ---- Supabase Realtime ----

  connect(userId: number): void {
    if (this.supabase) return;

    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);

    // Assina canal de badge do usuário
    const badgeChannel = this.supabase.channel(`badge:${userId}`);
    badgeChannel
      .on('broadcast', { event: 'update' }, ({ payload }) => {
        this.badgeSubject.next(payload as number);
      })
      .subscribe();
    this.channels.set(`badge:${userId}`, badgeChannel);
  }

  subscribeToConversa(conversaId: string): void {
    const key = `chat:${conversaId}`;
    if (!this.supabase || this.channels.has(key)) return;

    const channel = this.supabase.channel(key);
    channel
      .on('broadcast', { event: 'mensagem' }, ({ payload }) => {
        this.messagesSubject.next(payload as MensagemChat);
      })
      .subscribe();
    this.channels.set(key, channel);
  }

  unsubscribeFromConversa(conversaId: string): void {
    const key = `chat:${conversaId}`;
    const channel = this.channels.get(key);
    if (channel) {
      this.supabase?.removeChannel(channel);
      this.channels.delete(key);
    }
  }

  setActiveConversa(conversaId: string | null): void {
    this._activeConversaId = conversaId;
  }

  isConnected(): boolean {
    return this.supabase !== null;
  }

  setBadge(value: number): void {
    this.badgeSubject.next(value);
  }

  disconnect(): void {
    if (this.supabase) {
      this.supabase.removeAllChannels();
      this.supabase = null;
    }
    this.channels.clear();
    this._activeConversaId = null;
  }
}
