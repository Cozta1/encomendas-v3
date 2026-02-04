import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ChecklistBoard,
  ChecklistCard,
  ChecklistLogRequest
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

  atualizarDescricaoCard(cardId: string, descricao: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/cards/${cardId}`, { descricao });
  }

  adicionarItem(cardId: string, descricao: string, ordem: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/itens`, {
      cardId,
      descricao,
      ordem
    });
  }
}
