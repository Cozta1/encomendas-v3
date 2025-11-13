import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EncomendaRequest, EncomendaResponse } from '../models/encomenda.interfaces';

@Injectable({
  providedIn: 'root'
})
export class EncomendaService {
  private readonly API_URL = 'http://localhost:8080/api/encomendas';

  constructor(private http: HttpClient) {}

  /**
   * Busca as encomendas da equipe ativa.
   */
  getEncomendas(): Observable<EncomendaResponse[]> {
    return this.http.get<EncomendaResponse[]>(this.API_URL);
  }

  /**
   * Cria uma nova encomenda.
   */
  criarEncomenda(encomenda: EncomendaRequest): Observable<EncomendaResponse> {
    return this.http.post<EncomendaResponse>(this.API_URL, encomenda);
  }

  /**
   * (FUTURO) Busca detalhes de uma encomenda.
  getEncomendaPorId(id: string): Observable<EncomendaResponse> {
    return this.http.get<EncomendaResponse>(`${this.API_URL}/${id}`);
  }
  */

  /**
   * Remove uma encomenda pelo ID.
   */
  removerEncomenda(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  // --- NOVO MÉTODO ---
  /**
   * Envia uma requisição para avançar a etapa da encomenda.
   */
  avancarEtapa(id: string): Observable<EncomendaResponse> {
    // Usamos PATCH pois é uma atualização parcial
    return this.http.patch<EncomendaResponse>(`${this.API_URL}/${id}/avancar`, {});
  }

  // --- NOVO MÉTODO ---
  /**
   * Envia uma requisição para retornar a etapa da encomenda.
   */
  retornarEtapa(id: string): Observable<EncomendaResponse> {
    return this.http.patch<EncomendaResponse>(`${this.API_URL}/${id}/retornar`, {});
  }
}
