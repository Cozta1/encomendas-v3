import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { TeamService } from '../team/team.service'; // Importa o TeamService

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const teamService = inject(TeamService); // <--- INJETA O SERVIÇO

  const token = authService.getToken();
  const teamId = teamService.getEquipaAtivaId(); // <--- AGORA FUNCIONA

  let headers = req.headers;

  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }
  if (teamId) {
    headers = headers.set('X-Team-ID', teamId);
  }

  const authReq = req.clone({ headers });
  return next(authReq);
};
