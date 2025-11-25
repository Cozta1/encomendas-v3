import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

interface AuthResponse {
  accessToken: string;
  tokenType: string;
  role: string;
  nome: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:8080/api/auth';
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_ROLE_KEY = 'user_role';
  private readonly USER_NAME_KEY = 'user_name';

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, { email, password })
      .pipe(
        tap(response => {
          if (response && response.accessToken) {
            localStorage.setItem(this.TOKEN_KEY, response.accessToken);
            localStorage.setItem(this.USER_ROLE_KEY, response.role); // Salva a Role
            localStorage.setItem(this.USER_NAME_KEY, response.nome);
          }
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_ROLE_KEY);
    localStorage.removeItem(this.USER_NAME_KEY);
    localStorage.removeItem('active_team_id'); // Limpa equipe ativa também
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUserRole(): string | null {
    return localStorage.getItem(this.USER_ROLE_KEY);
  }

  isAdmin(): boolean {
    return this.getUserRole() === 'ROLE_ADMIN';
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.API_URL}/register`, data, { responseType: 'text' });
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.API_URL}/forgot-password`, { email }, { responseType: 'text' });
  }

  resetPassword(data: any): Observable<any> {
    return this.http.post(`${this.API_URL}/reset-password`, data, { responseType: 'text' });
  }
}
