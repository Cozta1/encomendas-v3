import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EncomendaRequest, EncomendaResponse } from '../models/encomenda.interfaces';

@Injectable({
  providedIn: 'root'
})
export class EncomendaService {

  private apiUrl = `${environment.apiUrl}/encomendas`;

  constructor(private http: HttpClient) { }

  getEncomendas(): Observable<EncomendaResponse[]> {
    return this.http.get<EncomendaResponse[]>(this.apiUrl);
  }

  // --- MÉTODO ADICIONADO ---
  getEncomendaById(id: string): Observable<EncomendaResponse> {
    return this.http.get<EncomendaResponse>(`${this.apiUrl}/${id}`);
  }

  criarEncomenda(encomenda: EncomendaRequest): Observable<EncomendaResponse> {
    return this.http.post<EncomendaResponse>(this.apiUrl, encomenda);
  }

  avancarEtapa(id: string): Observable<EncomendaResponse> {
    return this.http.patch<EncomendaResponse>(`${this.apiUrl}/${id}/avancar`, {});
  }

  retornarEtapa(id: string): Observable<EncomendaResponse> {
    return this.http.patch<EncomendaResponse>(`${this.apiUrl}/${id}/retornar`, {});
  }

  cancelarEncomenda(id: string): Observable<EncomendaResponse> {
    return this.http.patch<EncomendaResponse>(`${this.apiUrl}/${id}/cancelar`, {});
  }

  descancelarEncomenda(id: string): Observable<EncomendaResponse> {
    return this.http.patch<EncomendaResponse>(`${this.apiUrl}/${id}/descancelar`, {});
  }

  removerEncomenda(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
