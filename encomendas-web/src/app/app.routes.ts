import { Routes } from '@angular/router';
import { LoginComponent } from './login/login'; // Ajuste o caminho se necessário, dependendo de como a pasta foi criada

export const routes: Routes = [
  // Rota para a tela de login
  { path: 'login', component: LoginComponent },

  // Rota padrão: redireciona para /login se o utilizador aceder à raiz (http://localhost:4200/)
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  // Rota coringa: para qualquer URL desconhecida, redireciona para login (por enquanto)
  { path: '**', redirectTo: '/login' }
];
