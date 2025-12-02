import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EncomendaRequest, EncomendaResponse } from '../models/encomenda.interfaces';
import { environment } from '../../../environments/environment'; // IMPORTAR

@Injectable({
  providedIn: 'root'
})
export class EncomendaService {
  // Alterado para usar o environment
  private readonly API_URL = `${environment.apiUrl}/encomendas`;

  constructor(private http: HttpClient) {}

  getEncomendas(): Observable<EncomendaResponse[]> {
    return this.http.get<EncomendaResponse[]>(this.API_URL);
  }

  criarEncomenda(encomenda: EncomendaRequest): Observable<EncomendaResponse> {
    return this.http.post<EncomendaResponse>(this.API_URL, encomenda);
  }

  removerEncomenda(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  avancarEtapa(id: string): Observable<EncomendaResponse> {
    return this.http.patch<EncomendaResponse>(`${this.API_URL}/${id}/avancar`, {});
  }

  retornarEtapa(id: string): Observable<EncomendaResponse> {
    return this.http.patch<EncomendaResponse>(`${this.API_URL}/${id}/retornar`, {});
  }

  cancelarEncomenda(id: string): Observable<EncomendaResponse> {
    return this.http.patch<EncomendaResponse>(`${this.API_URL}/${id}/cancelar`, {});
  }
}
