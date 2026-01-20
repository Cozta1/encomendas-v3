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

  // 1. Ignorar APIs externas (ViaCEP, etc) para evitar erro de CORS
  if (req.url.includes('viacep.com.br')) {
    return next(req);
  }

  // 2. Pegar dados do LocalStorage
  const token = localStorage.getItem('auth_token');
  const teamId = localStorage.getItem('active_team_id');

  let headers = req.headers;

  // 3. Adicionar Token
  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  // 4. Adicionar ID da Equipe
  if (teamId) {
    headers = headers.set('X-Team-ID', teamId);
  }

  // 5. Clonar requisição
  const authReq = req.clone({ headers });

  // 6. Processar a requisição com tratamento de ERRO
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {

      // Verifica se o erro é de Autenticação (401) ou Permissão (403)
      if (error.status === 401 || error.status === 403) {

        // Evita loop infinito se o erro acontecer na própria tela de login
        if (!req.url.includes('/auth/login')) {

          // Desloga o usuário e manda para o login
          authService.logout();
          router.navigate(['/login']);

          // Retorna EMPTY para "morrer" o erro aqui e não sujar o console
          return EMPTY;
        }
      }

      // Se for outro erro (ex: 500, 404), deixa passar para o componente tratar
      return throwError(() => error);
    })
  );
};
