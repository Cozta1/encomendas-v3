import { Routes } from '@angular/router';
import { LoginComponent } from './login/login'; // Ficheiro simplificado
import { MainComponent } from './layout/main/main'; // Ficheiro simplificado
import { Dashboard } from './dashboard/dashboard'; // Ficheiro simplificado
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  // Rota pública (fora do layout principal)
  { path: 'login', component: LoginComponent },

  // Rota "pai" que usa o MainComponent como layout
  // Todas as rotas aqui dentro exigem login (devido ao authGuard)
  {
    path: '', // O caminho raiz da aplicação protegida
    component: MainComponent,
    canActivate: [authGuard],
    children: [
      // Rotas "filhas" que aparecem dentro do <router-outlet> do MainComponent
      { path: 'dashboard', component: Dashboard },

      // Redireciona a raiz autenticada (ex: http://localhost:4200/) para o dashboard
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // Rota coringa (se não encontrar, redireciona para a raiz, que será tratada pelo guard)
  { path: '**', redirectTo: '' }
];
