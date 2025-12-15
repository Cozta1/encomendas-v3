import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Este interceptor funcional captura TODAS as requisições HTTP.
 * Ele lê o token e o ID da equipe DIRETAMENTE do localStorage.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {

  // --- CORREÇÃO CORS ---
  // Verifica se a requisição é para o ViaCEP (ou outra API externa).
  // Se for, NÃO adiciona os headers da nossa API (Authorization, X-Team-ID),
  // pois isso causa erro de CORS (preflight response error).
  if (req.url.includes('viacep.com.br')) {
    return next(req);
  }

  // 1. Pega os valores direto do localStorage
  const token = localStorage.getItem('auth_token');
  const teamId = localStorage.getItem('active_team_id');

  let headers = req.headers;

  // 2. Adiciona o Token de Autenticação (Bearer token) se ele existir
  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  // 3. Adiciona o ID da Equipe Ativa se ele existir
  if (teamId) {
    headers = headers.set('X-Team-ID', teamId);
  }

  // Clona a requisição original, substituindo pelos novos headers
  const authReq = req.clone({ headers });

  // Passa a requisição modificada para o próximo manipulador
  return next(authReq);
};
