import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ChecklistBoard,
  ChecklistCard,
  ChecklistItem,
  ChecklistLogRequest,
  ChecklistRelatorio
} from '../models/checklist.interfaces';

@Injectable({
  providedIn: 'root'
})
export class ChecklistService {
  private apiUrl = `${environment.apiUrl}/checklists`;

  constructor(private http: HttpClient) {}

  // --- FUNCIONÁRIO (Depende da Escala) ---
  getChecklistDoDia(equipeId: string, data?: string, usuarioIdAlvo?: number): Observable<ChecklistBoard[]> {
    let params = new HttpParams().set('equipeId', equipeId);

    if (data) {
      params = params.set('data', data);
    }
    if (usuarioIdAlvo) {
      params = params.set('usuarioId', usuarioIdAlvo.toString());
    }

    return this.http.get<ChecklistBoard[]>(`${this.apiUrl}/dia`, { params });
  }

  // --- ADMIN (Lista Tudo) ---
  getAllBoards(equipeId: string): Observable<ChecklistBoard[]> {
    const params = new HttpParams().set('equipeId', equipeId);
    return this.http.get<ChecklistBoard[]>(`${this.apiUrl}/boards`, { params });
  }

  // --- AÇÕES ---
  registrarAcao(request: ChecklistLogRequest, usuarioId?: number): Observable<void> {
    let params = new HttpParams();
    if (usuarioId) {
      params = params.set('usuarioId', usuarioId.toString());
    }
    return this.http.post<void>(`${this.apiUrl}/log`, request, { params });
  }

  // --- ADMINISTRAÇÃO ESTRUTURAL ---

  criarBoard(nome: string, equipeId: string, usuarioId?: number | null): Observable<ChecklistBoard> {
    const payload: any = { nome, equipeId };
    if (usuarioId) {
      payload.usuarioId = usuarioId;
    }
    return this.http.post<ChecklistBoard>(`${this.apiUrl}/boards`, payload);
  }

  adicionarCard(boardId: string, titulo: string, horarioAbertura: string, horarioFechamento: string): Observable<ChecklistCard> {
    return this.http.post<ChecklistCard>(`${this.apiUrl}/cards`, {
      boardId,
      titulo,
      horarioAbertura,
      horarioFechamento
    });
  }

  atualizarBoard(boardId: string, changes: { nome?: string }): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/boards/${boardId}`, changes);
  }

  excluirBoard(boardId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/boards/${boardId}`);
  }

  atualizarCard(cardId: string, changes: { titulo?: string; descricao?: string; horarioAbertura?: string; horarioFechamento?: string }): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/cards/${cardId}`, changes);
  }

  // Keep the old method name as an alias for backward compatibility
  atualizarDescricaoCard(cardId: string, descricao: string): Observable<void> {
    return this.atualizarCard(cardId, { descricao });
  }

  excluirCard(cardId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/cards/${cardId}`);
  }

  moverCard(cardId: string, boardId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/cards/${cardId}/mover`, { boardId });
  }

  adicionarItem(cardId: string, descricao: string, ordem: number): Observable<ChecklistItem> {
    return this.http.post<ChecklistItem>(`${this.apiUrl}/itens`, {
      cardId,
      descricao,
      ordem
    });
  }

  excluirItem(itemId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/itens/${itemId}`);
  }

  // --- PERSISTÊNCIA DE ORDEM (DRAG & DROP) ---

  reordenarBoards(boards: ChecklistBoard[]): Observable<void> {
    // Mapeia apenas o ID e a nova posição (índice no array)
    const payload = boards.map((b, index) => ({
      id: b.id,
      ordem: index
    }));
    return this.http.put<void>(`${this.apiUrl}/boards/reordenar`, payload);
  }

  reordenarCards(cards: ChecklistCard[]): Observable<void> {
    // Mapeia apenas o ID e a nova posição
    const payload = cards.map((c, index) => ({
      id: c.id,
      ordem: index
    }));
    return this.http.put<void>(`${this.apiUrl}/cards/reordenar`, payload);
  }

  // --- RELATÓRIO DE ATIVIDADES (Admin) ---
  getRelatorio(equipeId: string, data: string): Observable<ChecklistRelatorio> {
    const params = new HttpParams().set('equipeId', equipeId).set('data', data);
    return this.http.get<ChecklistRelatorio>(`${this.apiUrl}/relatorio`, { params });
  }
}
