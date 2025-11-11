import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
// CORREÇÕES AQUI:
import { Main } from './layout/main/main';
import { Dashboard } from './dashboard/dashboard';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  // Rota pública (fora do layout principal)
  { path: 'login', component: LoginComponent },

  // Rota "pai" que usa o Main como layout
  {
    path: '', // O caminho raiz da aplicação protegida
    component: Main, // <-- CORREÇÃO AQUI
    canActivate: [authGuard],
    children: [
      // Rotas "filhas" que aparecem dentro do <router-outlet> do Main
      { path: 'dashboard', component: Dashboard }, // <-- CORREÇÃO AQUI

      // Redireciona a raiz autenticada (ex: http://localhost:4200/) para o dashboard
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // Rota coringa
  { path: '**', redirectTo: '' }
];
