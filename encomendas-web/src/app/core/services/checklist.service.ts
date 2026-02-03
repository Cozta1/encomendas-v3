import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChecklistBoard, ChecklistCard, ChecklistLogRequest } from '../models/checklist.interfaces';

@Injectable({
  providedIn: 'root'
})
export class ChecklistService {
  private apiUrl = `${environment.apiUrl}/checklists`;

  constructor(private http: HttpClient) {}

  // Busca a estrutura completa do dia (Boards -> Cards -> Itens + Status)
  getChecklistDoDia(equipeId: string, data?: string, usuarioIdAlvo?: number): Observable<ChecklistBoard[]> {
    let params = new HttpParams().set('equipeId', equipeId);

    if (data) {
      params = params.set('data', data);
    }
    if (usuarioIdAlvo) {
      params = params.set('usuarioIdAlvo', usuarioIdAlvo.toString());
    }

    return this.http.get<ChecklistBoard[]>(`${this.apiUrl}/dia`, { params });
  }

  // Registra a ação de marcar/desmarcar (Log)
  registrarAcao(request: ChecklistLogRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/log`, request);
  }

  // --- Métodos Administrativos (Criação de Estrutura) ---

  // CORREÇÃO AQUI: Adicionado parâmetro opcional usuarioId
  criarBoard(nome: string, equipeId: string, usuarioId?: number | null): Observable<ChecklistBoard> {
    const payload: any = { nome, equipeId };

    // Só envia se tiver valor
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

  adicionarItem(cardId: string, descricao: string, ordem: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/itens`, {
      cardId,
      descricao,
      ordem
    });
  }
}
