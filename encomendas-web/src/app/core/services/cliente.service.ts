import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ClienteResponse, ClienteRequest } from '../models/cliente.interfaces';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private readonly API_URL = 'http://localhost:8080/api/clientes'; // Porta 8080

  constructor(private http: HttpClient) {}

  getClientes(): Observable<ClienteResponse[]> {
    return this.http.get<ClienteResponse[]>(this.API_URL);
  }

  criarCliente(cliente: ClienteRequest): Observable<ClienteResponse> {
    return this.http.post<ClienteResponse>(this.API_URL, cliente);
  }

  // --- NOVO MÉTODO (UPDATE) ---
  atualizarCliente(id: string, cliente: ClienteRequest): Observable<ClienteResponse> {
    return this.http.put<ClienteResponse>(`${this.API_URL}/${id}`, cliente);
  }

  // --- NOVO MÉTODO (DELETE) ---
  removerCliente(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
