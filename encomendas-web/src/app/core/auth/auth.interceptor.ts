import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Interceptor que adiciona token, team-id e gerencia expiração de sessão.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Injeção de dependências dentro do contexto funcional
  const router = inject(Router);
  const authService = inject(AuthService);

  // 1. Ignorar APIs externas (ViaCEP, etc) para evitar erro CORS
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

  // 6. Processar a requisição e capturar erros (Logout Automático)
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Se o erro for 401 (Não autorizado) ou 403 (Proibido), o token expirou ou é inválido
      if (error.status === 401 || error.status === 403) {

        // Evita loop infinito se o erro acontecer na própria tela de login
        if (!req.url.includes('/auth/login')) {
          authService.logout(); // Limpa o localStorage
          router.navigate(['/login']); // Manda pro login
        }
      }

      // Repassa o erro para o componente tratar se necessário (ex: mostrar mensagem)
      return throwError(() => error);
    })
  );
};
