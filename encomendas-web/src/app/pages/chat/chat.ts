import {
  Component, OnInit, OnDestroy, AfterViewChecked,
  ViewChild, ElementRef, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/auth/auth.service';
import { TeamService } from '../../core/team/team.service';
import { UsuarioResponse } from '../../core/models/usuario.interfaces';
import {
  Conversa, MensagemChat, EnviarMensagemRequest,
  UploadedFile, CriarConversaRequest
} from '../../core/models/chat.interfaces';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatListModule,
    MatDividerModule,
    MatChipsModule,
    MatBadgeModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './chat.html',
  styleUrls: ['./chat.scss']
})
export class ChatPage implements OnInit, OnDestroy, AfterViewChecked {

  @ViewChild('messagesEnd') messagesEnd!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  conversas: Conversa[] = [];
  conversaAtiva: Conversa | null = null;
  mensagens: MensagemChat[] = [];
  textoMensagem = '';
  pendingAnexos: UploadedFile[] = [];

  loadingConversas = false;
  loadingMensagens = false;
  enviando = false;
  carregandoPagina = false;
  paginaAtual = 0;
  temMaisAnteriores = true;

  // Member selector
  membrosEquipe: UsuarioResponse[] = [];
  showMemberSelect = false;
  filtroBusca = '';

  private userId!: number;
  private equipeId!: string;
  private msgSub: Subscription | undefined;
  private shouldScroll = false;
  private activeConversaSubscription: string | null = null;

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private teamService: TeamService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (!user) return;
    this.userId = user.id;

    const equipeId = this.teamService.getEquipeAtivaId();
    if (!equipeId) {
      this.snackBar.open('Selecione uma equipe primeiro.', 'OK', { duration: 3000 });
      return;
    }
    this.equipeId = equipeId;

    this.chatService.connect(this.userId);

    this.msgSub = this.chatService.messages$.subscribe(msg => {
      if (this.conversaAtiva && msg.conversaId === this.conversaAtiva.id) {
        this.mensagens.push(msg);
        this.shouldScroll = true;
        this.cdr.detectChanges();
        if (msg.remetenteId !== this.userId) {
          this.chatService.marcarLida(this.conversaAtiva.id, this.userId).subscribe();
          const c = this.conversas.find(c => c.id === msg.conversaId);
          if (c) c.naoLidas = 0;
        }
      } else {
        const c = this.conversas.find(c => c.id === msg.conversaId);
        if (c && msg.remetenteId !== this.userId) {
          c.naoLidas = (c.naoLidas || 0) + 1;
        }
      }
    });

    this.carregarConversas();
    this.carregarMembros();
  }

  ngOnDestroy(): void {
    this.msgSub?.unsubscribe();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  carregarConversas(): void {
    this.loadingConversas = true;
    this.chatService.getConversas(this.equipeId, this.userId).subscribe({
      next: conversas => {
        this.conversas = conversas;
        this.loadingConversas = false;

        const grupo = conversas.find(c => c.tipo === 'GRUPO');
        if (grupo) {
          this.abrirConversa(grupo);
        } else {
          const req: CriarConversaRequest = { equipeId: this.equipeId };
          this.chatService.criarConversa(req).subscribe(resp => {
            this.carregarConversas();
          });
        }
      },
      error: () => {
        this.loadingConversas = false;
        this.snackBar.open('Erro ao carregar conversas', 'OK', { duration: 3000 });
      }
    });
  }

  carregarMembros(): void {
    this.teamService.getMembros(this.equipeId).subscribe({
      next: membros => {
        this.membrosEquipe = membros.filter(m => m.id !== this.userId);
      },
      error: () => {}
    });
  }

  toggleMemberSelect(): void {
    this.showMemberSelect = !this.showMemberSelect;
    this.filtroBusca = '';
  }

  get membrosFiltrados(): UsuarioResponse[] {
    if (!this.filtroBusca.trim()) return this.membrosEquipe;
    const f = this.filtroBusca.toLowerCase();
    return this.membrosEquipe.filter(m =>
      m.nomeCompleto.toLowerCase().includes(f) ||
      (m.cargo ?? '').toLowerCase().includes(f)
    );
  }

  abrirConversa(conversa: Conversa): void {
    if (this.conversaAtiva?.id === conversa.id) return;

    if (this.activeConversaSubscription) {
      this.chatService.unsubscribeFromConversa(this.activeConversaSubscription);
    }

    this.conversaAtiva = conversa;
    this.mensagens = [];
    this.paginaAtual = 0;
    this.temMaisAnteriores = true;

    if (conversa.tipo === 'GRUPO') {
      this.chatService.subscribeToConversa(conversa.id);
      this.activeConversaSubscription = conversa.id;
    }

    this.carregarMensagens(0, true);

    conversa.naoLidas = 0;
    this.chatService.marcarLida(conversa.id, this.userId).subscribe();
  }

  carregarMensagens(page: number = 0, append: boolean = false): void {
    if (!this.conversaAtiva) return;
    this.loadingMensagens = page === 0;
    this.carregandoPagina = page > 0;

    this.chatService.getMensagens(this.conversaAtiva.id, page).subscribe({
      next: msgs => {
        if (page === 0) {
          this.mensagens = msgs;
          this.shouldScroll = true;
        } else {
          this.mensagens = [...msgs, ...this.mensagens];
        }
        if (msgs.length < 30) this.temMaisAnteriores = false;
        this.loadingMensagens = false;
        this.carregandoPagina = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingMensagens = false;
        this.carregandoPagina = false;
      }
    });
  }

  carregarAnteriores(): void {
    if (!this.temMaisAnteriores || this.carregandoPagina) return;
    this.paginaAtual++;
    this.carregarMensagens(this.paginaAtual, false);
  }

  enviarMensagem(): void {
    const texto = this.textoMensagem.trim();
    if (!texto && this.pendingAnexos.length === 0) return;
    if (!this.conversaAtiva || this.enviando) return;

    const req: EnviarMensagemRequest = {
      conversaId: this.conversaAtiva.id,
      conteudo: texto || undefined,
      urlsAnexos: this.pendingAnexos.length > 0 ? [...this.pendingAnexos] : undefined
    };

    this.textoMensagem = '';
    this.pendingAnexos = [];

    this.chatService.enviarMensagemWs(req);
  }

  onEnterKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.enviarMensagem();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    Array.from(input.files).forEach(file => {
      this.chatService.uploadAnexo(file).subscribe({
        next: uploaded => {
          this.pendingAnexos.push(uploaded);
          this.cdr.detectChanges();
        },
        error: () => {
          this.snackBar.open('Erro ao enviar ficheiro', 'OK', { duration: 3000 });
        }
      });
    });

    input.value = '';
  }

  removerAnexo(index: number): void {
    this.pendingAnexos.splice(index, 1);
  }

  iniciarPrivado(destinatarioId: number): void {
    // If conversation already exists in the list, just open it
    const existing = this.conversas.find(c =>
      c.tipo === 'PRIVADO' && c.outroUsuarioId === destinatarioId
    );
    if (existing) {
      this.showMemberSelect = false;
      this.filtroBusca = '';
      this.abrirConversa(existing);
      return;
    }

    const req: CriarConversaRequest = { equipeId: this.equipeId, destinatarioId };
    this.chatService.criarConversa(req).subscribe({
      next: resp => {
        this.showMemberSelect = false;
        this.filtroBusca = '';
        this.chatService.getConversas(this.equipeId, this.userId).subscribe({
          next: conversas => {
            this.conversas = conversas;
            const novaConversa = conversas.find(c => c.id === resp.id);
            if (novaConversa) this.abrirConversa(novaConversa);
          }
        });
      },
      error: () => {
        this.snackBar.open('Erro ao iniciar conversa', 'OK', { duration: 3000 });
      }
    });
  }

  isMine(msg: MensagemChat): boolean {
    return msg.remetenteId === this.userId;
  }

  readonly baseUrl = environment.baseUrl;

  isImage(url: string): boolean {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesEnd) {
        this.messagesEnd.nativeElement.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (e) {}
  }
}
