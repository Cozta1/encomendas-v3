import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
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

      // 401 = sessão expirada → desloga e redireciona, mas PROPAGA o erro
      // para que o componente chamador possa fazer rollback de mudanças otimistas.
      if (error.status === 401) {
        if (!req.url.includes('/auth/login')) {
          authService.logout();
          router.navigate(['/login']);
        }
      }

      // 403 = permissão negada → NÃO redireciona. Deixa o componente tratar.
      // Todos os erros (401, 403, 500, 404, etc.) são propagados para o componente.
      return throwError(() => error);
    })
  );
};
