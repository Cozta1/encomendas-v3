import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

interface AuthResponse {
  accessToken: string;
  tokenType: string;
  role: string;
  nome: string;
  id: number; // <--- NOVO: Recebe o ID do backend
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/auth`;

  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_ROLE_KEY = 'user_role';
  private readonly USER_NAME_KEY = 'user_name';
  private readonly USER_ID_KEY = 'user_id'; // <--- Chave para salvar o ID

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, { email, password })
      .pipe(
        tap(response => {
          if (response && response.accessToken) {
            localStorage.setItem(this.TOKEN_KEY, response.accessToken);
            localStorage.setItem(this.USER_ROLE_KEY, response.role);
            localStorage.setItem(this.USER_NAME_KEY, response.nome);

            // --- SALVAR O ID ---
            if (response.id) {
                localStorage.setItem(this.USER_ID_KEY, String(response.id));
            }
          }
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_ROLE_KEY);
    localStorage.removeItem(this.USER_NAME_KEY);
    localStorage.removeItem(this.USER_ID_KEY); // Limpa o ID
    localStorage.removeItem('active_team_id');
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUserRole(): string | null {
    return localStorage.getItem(this.USER_ROLE_KEY);
  }

  // --- O MÉTODO QUE FALTAVA ---
  getUser(): { id: number, nome: string, role: string } | null {
    const id = localStorage.getItem(this.USER_ID_KEY);
    const nome = localStorage.getItem(this.USER_NAME_KEY);
    const role = localStorage.getItem(this.USER_ROLE_KEY);

    if (id && nome && role) {
      return {
        id: Number(id),
        nome: nome,
        role: role
      };
    }
    return null;
  }
  // -----------------------------

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
