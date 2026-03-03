import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TicketRequest {
  categoria: string;
  titulo: string;
  descricao: string;
  nomeUsuario: string;
  equipeNome: string;
}

@Injectable({ providedIn: 'root' })
export class SuporteService {
  private readonly apiUrl = `${environment.apiUrl}/support/ticket`;

  constructor(private http: HttpClient) {}

  enviarTicket(ticket: TicketRequest): Observable<void> {
    return this.http.post<void>(this.apiUrl, ticket);
  }
}