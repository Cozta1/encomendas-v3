import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProdutoResponse, ProdutoRequest } from '../models/produto.interfaces';

@Injectable({
  providedIn: 'root'
})
export class ProdutoService {
  private readonly API_URL = 'http://localhost:8080/api/produtos';

  constructor(private http: HttpClient) {}

  /**
   * Busca os produtos da equipe ativa.
   */
  getProdutos(): Observable<ProdutoResponse[]> {
    return this.http.get<ProdutoResponse[]>(this.API_URL);
  }

  /**
   * Cria um novo produto.
   */
  criarProduto(produto: ProdutoRequest): Observable<ProdutoResponse> {
    return this.http.post<ProdutoResponse>(this.API_URL, produto);
  }

  /**
   * Atualiza um produto existente.
   */
  atualizarProduto(id: string, produto: ProdutoRequest): Observable<ProdutoResponse> {
    return this.http.put<ProdutoResponse>(`${this.API_URL}/${id}`, produto);
  }

  /**
   * Remove um produto pelo ID.
   */
  removerProduto(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
