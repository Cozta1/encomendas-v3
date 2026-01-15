import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError, EMPTY } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Interceptor que adiciona token, team-id e gerencia expiração de sessão.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  // 1. Ignorar APIs externas (ViaCEP, etc)
  if (req.url.includes('viacep.com.br')) {
    return next(req);
  }

  // 2. Pegar dados do LocalStorage
  const token = localStorage.getItem('auth_token');
  const teamId = localStorage.getItem('active_team_id');

  let headers = req.headers;

  // 3. Adicionar Token de Autenticação se existir
  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  // 4. Adicionar ID da Equipe se existir
  if (teamId) {
    headers = headers.set('X-Team-ID', teamId);
  }

  // 5. Clonar requisição com os novos headers
  const authReq = req.clone({ headers });

  // 6. Processar a requisição e capturar erros (Logout Automático)
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {

      // Se a sessão for inválida (401) ou proibida (403)
      if (error.status === 401 || error.status === 403) {

        // Evita loop se o erro ocorrer na própria página de login
        if (!req.url.includes('/auth/login')) {

          // Limpa sessão e redireciona
          authService.logout();
          router.navigate(['/login']);

          // Retorna EMPTY para "engolir" o erro e não mostrar vermelho no console
          return EMPTY;
        }
      }

      // Outros erros (500, 404) continuam sendo repassados
      return throwError(() => error);
    })
  );
};
