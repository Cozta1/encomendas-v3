import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProdutoResponse, ProdutoRequest } from '../models/produto.interfaces';
import { environment } from '../../../environments/environment'; // IMPORTAR

@Injectable({
  providedIn: 'root'
})
export class ProdutoService {
  // Alterado para usar o environment
  private readonly API_URL = `${environment.apiUrl}/produtos`;

  constructor(private http: HttpClient) {}

  getProdutos(): Observable<ProdutoResponse[]> {
    return this.http.get<ProdutoResponse[]>(this.API_URL);
  }

  searchProdutos(nome: string): Observable<ProdutoResponse[]> {
    const params = new HttpParams().set('nome', nome);
    return this.http.get<ProdutoResponse[]>(`${this.API_URL}/search`, { params });
  }

  criarProduto(produto: ProdutoRequest): Observable<ProdutoResponse> {
    return this.http.post<ProdutoResponse>(this.API_URL, produto);
  }

  atualizarProduto(id: string, produto: ProdutoRequest): Observable<ProdutoResponse> {
    return this.http.put<ProdutoResponse>(`${this.API_URL}/${id}`, produto);
  }

  removerProduto(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
