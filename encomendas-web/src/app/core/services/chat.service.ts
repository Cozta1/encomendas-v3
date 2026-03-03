import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import {
  Conversa,
  MensagemChat,
  EnviarMensagemRequest,
  UploadedFile,
  CriarConversaRequest
} from '../models/chat.interfaces';
// Lazy imports handled inside connect() to avoid esbuild CJS/UMD interop issues at module init time
import type { Client as StompClient, IMessage } from '@stomp/stompjs';

@Injectable({ providedIn: 'root' })
export class ChatService implements OnDestroy {
  private apiUrl = `${environment.apiUrl}/chat`;

  private stompClient: StompClient | null = null;
  private conversaSubscriptions = new Map<string, any>();

  // Group topics the component wants subscribed (persists across reconnects)
  private activeGroupTopics = new Set<string>();

  private messagesSubject = new Subject<MensagemChat>();
  public messages$ = this.messagesSubject.asObservable();

  private badgeSubject = new BehaviorSubject<number>(0);
  public badge$ = this.badgeSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // ---- REST ----

  getConversas(equipeId: string, usuarioId: number): Observable<Conversa[]> {
    const params = new HttpParams()
      .set('equipeId', equipeId)
      .set('usuarioId', usuarioId.toString());
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

  uploadAnexo(file: File): Observable<UploadedFile> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UploadedFile>(`${this.apiUrl}/mensagens/upload`, formData);
  }

  marcarLida(conversaId: string, usuarioId: number): Observable<void> {
    const params = new HttpParams().set('usuarioId', usuarioId.toString());
    return this.http.post<void>(`${this.apiUrl}/mensagens/${conversaId}/lida`, {}, { params });
  }

  getBadge(equipeId: string, usuarioId: number): Observable<number> {
    const params = new HttpParams()
      .set('equipeId', equipeId)
      .set('usuarioId', usuarioId.toString());
    return this.http.get<number>(`${this.apiUrl}/badge`, { params });
  }

  // ---- WebSocket ----

  connect(userId: number): void {
    if (this.stompClient?.active) return;

    const token = this.authService.getToken();

    // Dynamically import @stomp/stompjs and sockjs-client at call time.
    // This avoids UMD/CJS module-init errors at lazy chunk load time (esbuild interop).
    Promise.all([
      import('@stomp/stompjs'),
      import('sockjs-client')
    ]).then(([stompModule, sockjsModule]) => {
      const Client = stompModule.Client;
      // sockjs-client is CJS: esbuild's __toESM puts the constructor on .default
      const SockJS: new (url: string) => WebSocket =
        (sockjsModule as any).default ?? (sockjsModule as any);

      this.stompClient = new Client({
        webSocketFactory: () => new SockJS(environment.wsUrl),
        connectHeaders: {
          Authorization: `Bearer ${token}`
        },
        reconnectDelay: 5000,
        onConnect: () => {
          // Clear stale subscriptions from a previous session (handles reconnects)
          this.conversaSubscriptions.clear();

          // Private messages — Spring user destinations use /user/queue/... without userId.
          // Spring routes via the WebSocket principal set in WebSocketAuthChannelInterceptor.
          this.stompClient!.subscribe(`/user/queue/chat`, (message: IMessage) => {
            const msg: MensagemChat = JSON.parse(message.body);
            this.messagesSubject.next(msg);
          });

          // Badge updates
          this.stompClient!.subscribe(`/user/queue/badge`, (message: IMessage) => {
            const count = JSON.parse(message.body);
            this.badgeSubject.next(count);
          });

          // Re-subscribe to all group topics that were requested before/during connection
          this.activeGroupTopics.forEach(id => this.doSubscribeToGroupTopic(id));
        }
      });

      this.stompClient.activate();
    }).catch(err => {
      console.error('[ChatService] Failed to load WebSocket libraries:', err);
    });
  }

  /**
   * Request a subscription to a group topic.
   * If the WebSocket is already connected, subscribes immediately.
   * If not yet connected, the subscription is queued and will be processed in onConnect.
   */
  subscribeToConversa(conversaId: string): void {
    this.activeGroupTopics.add(conversaId);

    if (this.stompClient?.connected) {
      this.doSubscribeToGroupTopic(conversaId);
    }
    // If not yet connected, onConnect will call doSubscribeToGroupTopic for all activeGroupTopics
  }

  unsubscribeFromConversa(conversaId: string): void {
    this.activeGroupTopics.delete(conversaId);
    const sub = this.conversaSubscriptions.get(conversaId);
    if (sub) {
      sub.unsubscribe();
      this.conversaSubscriptions.delete(conversaId);
    }
  }

  enviarMensagemWs(req: EnviarMensagemRequest): void {
    if (!this.stompClient?.connected) return;
    this.stompClient.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(req)
    });
  }

  setBadge(value: number): void {
    this.badgeSubject.next(value);
  }

  disconnect(): void {
    this.stompClient?.deactivate();
    this.stompClient = null;
    this.conversaSubscriptions.clear();
    this.activeGroupTopics.clear();
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  private doSubscribeToGroupTopic(conversaId: string): void {
    if (this.conversaSubscriptions.has(conversaId)) return;
    if (!this.stompClient?.connected) return;

    const sub = this.stompClient.subscribe(`/topic/chat.${conversaId}`, (message: IMessage) => {
      const msg: MensagemChat = JSON.parse(message.body);
      this.messagesSubject.next(msg);
    });
    this.conversaSubscriptions.set(conversaId, sub);
  }
}