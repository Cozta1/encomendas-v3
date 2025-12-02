import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FornecedorResponse, FornecedorRequest } from '../models/fornecedor.interfaces';
import { environment } from '../../../environments/environment'; // IMPORTAR

@Injectable({
  providedIn: 'root'
})
export class FornecedorService {
  // Alterado para usar o environment
  private readonly API_URL = `${environment.apiUrl}/fornecedores`;

  constructor(private http: HttpClient) {}

  getFornecedores(): Observable<FornecedorResponse[]> {
    return this.http.get<FornecedorResponse[]>(this.API_URL);
  }

  searchFornecedores(nome: string): Observable<FornecedorResponse[]> {
    const params = new HttpParams().set('nome', nome);
    return this.http.get<FornecedorResponse[]>(`${this.API_URL}/search`, { params });
  }

  criarFornecedor(fornecedor: FornecedorRequest): Observable<FornecedorResponse> {
    return this.http.post<FornecedorResponse>(this.API_URL, fornecedor);
  }

  atualizarFornecedor(id: string, fornecedor: FornecedorRequest): Observable<FornecedorResponse> {
    return this.http.put<FornecedorResponse>(`${this.API_URL}/${id}`, fornecedor);
  }

  removerFornecedor(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
