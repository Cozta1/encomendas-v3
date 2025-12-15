import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CepService {

  constructor(private http: HttpClient) { }

  buscarCep(cep: string): Observable<ViaCepResponse | null> {
    // Remove caracteres não numéricos
    const cepLimpo = cep.replace(/\D/g, '');

    // Valida tamanho do CEP (8 dígitos)
    if (cepLimpo.length !== 8) {
      return of(null);
    }

    // Consulta API ViaCEP
    return this.http.get<ViaCepResponse>(`https://viacep.com.br/ws/${cepLimpo}/json/`).pipe(
      catchError(err => {
        console.error('Erro ao buscar CEP', err);
        return of(null);
      })
    );
  }
}
