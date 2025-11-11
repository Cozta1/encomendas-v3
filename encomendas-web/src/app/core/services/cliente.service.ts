import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ClienteResponse, ClienteRequest } from '../models/cliente.interfaces';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private readonly API_URL = 'http://localhost:8080/api/clientes';

  constructor(private http: HttpClient) {}

  // Busca clientes. O interceptor já adiciona Auth e X-Team-ID
  getClientes(): Observable<ClienteResponse[]> {
    return this.http.get<ClienteResponse[]>(this.API_URL);
  }

  // (Futuro) Criar cliente
  criarCliente(cliente: ClienteRequest): Observable<ClienteResponse> {
    return this.http.post<ClienteResponse>(this.API_URL, cliente);
  }
}
