import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

// Interface para tipar a resposta do login (opcional, mas recomendado)
interface AuthResponse {
  accessToken: string;
  tokenType: string;
}

@Injectable({
  providedIn: 'root' // Torna o serviço disponível globalmente sem precisar declarar em um módulo
})
export class AuthService {
  private readonly API_URL = 'http://localhost:8080/api/auth';
  private readonly TOKEN_KEY = 'auth_token';

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, { email, password })
      .pipe(
        tap(response => {
          // Intercepta a resposta de sucesso para salvar o token
          if (response && response.accessToken) {
            localStorage.setItem(this.TOKEN_KEY, response.accessToken);
          }
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    // Aqui você poderia injetar o Router e fazer: this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    // Verificação simples: se tem token, assume que está logado.
    // Em uma aplicação real, você verificaria se o token não expirou (usando jwt-decode, por exemplo).
    return !!this.getToken();
  }
}
