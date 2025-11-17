import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ClienteResponse, ClienteRequest } from '../models/cliente.interfaces';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private readonly API_URL = 'http://localhost:8080/api/clientes';

  constructor(private http: HttpClient) {}

  getClientes(): Observable<ClienteResponse[]> {
    return this.http.get<ClienteResponse[]>(this.API_URL);
  }

  // --- NOVO MÉTODO (SEARCH) ---
  searchClientes(nome: string): Observable<ClienteResponse[]> {
    const params = new HttpParams().set('nome', nome);
    return this.http.get<ClienteResponse[]>(`${this.API_URL}/search`, { params });
  }

  criarCliente(cliente: ClienteRequest): Observable<ClienteResponse> {
    return this.http.post<ClienteResponse>(this.API_URL, cliente);
  }

  atualizarCliente(id: string, cliente: ClienteRequest): Observable<ClienteResponse> {
    return this.http.put<ClienteResponse>(`${this.API_URL}/${id}`, cliente);
  }

  removerCliente(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
