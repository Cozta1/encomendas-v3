import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
// Importar as interfaces
import { FornecedorResponse, FornecedorRequest } from '../models/fornecedor.interfaces';

@Injectable({
  providedIn: 'root'
})
export class FornecedorService {
  private readonly API_URL = 'http://localhost:8080/api/fornecedores';

  constructor(private http: HttpClient) {}

  /**
   * Busca os fornecedores da equipe ativa.
   */
  getFornecedores(): Observable<FornecedorResponse[]> {
    return this.http.get<FornecedorResponse[]>(this.API_URL);
  }

  /**
   * Cria um novo fornecedor.
   */
  criarFornecedor(fornecedor: FornecedorRequest): Observable<FornecedorResponse> {
    return this.http.post<FornecedorResponse>(this.API_URL, fornecedor);
  }

  /**
   * ATUALIZAÇÃO: Atualiza um fornecedor existente.
   */
  atualizarFornecedor(id: string, fornecedor: FornecedorRequest): Observable<FornecedorResponse> {
    return this.http.put<FornecedorResponse>(`${this.API_URL}/${id}`, fornecedor);
  }

  /**
   * ATUALIZAÇÃO: Remove um fornecedor pelo ID.
   */
  removerFornecedor(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
