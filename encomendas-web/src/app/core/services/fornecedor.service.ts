import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FornecedorResponse, FornecedorRequest } from '../models/fornecedor.interfaces';

@Injectable({
  providedIn: 'root'
})
export class FornecedorService {
  private readonly API_URL = 'http://localhost:8080/api/fornecedores';

  constructor(private http: HttpClient) {}

  /**
   * Busca fornecedores. O interceptor já adiciona Auth e X-Team-ID
   */
  getFornecedores(): Observable<FornecedorResponse[]> {
    return this.http.get<FornecedorResponse[]>(this.API_URL);
  }

  /**
   * Cria um novo fornecedor.
   */
  criarFornecedor(fornecedor: FornecedorRequest): Observable<FornecedorResponse> {
    // Retorna o FornecedorResponse que o backend devolve
    return this.http.post<FornecedorResponse>(this.API_URL, fornecedor);
  }
}
