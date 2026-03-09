import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EncomendaRequest, EncomendaResponse, PagedResult } from '../models/encomenda.interfaces';

@Injectable({
  providedIn: 'root'
})
export class EncomendaService {

  private apiUrl = `${environment.apiUrl}/encomendas`;

  constructor(private http: HttpClient) { }

  getEncomendas(page: number = 0, size: number = 20): Observable<PagedResult<EncomendaResponse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PagedResult<EncomendaResponse>>(this.apiUrl, { params });
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
