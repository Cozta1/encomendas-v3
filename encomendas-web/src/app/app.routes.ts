import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Register } from './login/register/register';
import { ForgotPassword } from './login/forgot-password/forgot-password';
import { Main } from './layout/main/main';
import { Dashboard } from './dashboard/dashboard';
import { authGuard } from './core/auth/auth.guard';

// Importar as páginas do sistema
import { Clientes } from './pages/clientes/clientes';
import { Produtos } from './pages/produtos/produtos';
import { Encomendas } from './pages/encomendas/encomendas';
import { Fornecedores } from './pages/fornecedores/fornecedores';
// 1. IMPORTAR A PÁGINA DE EQUIPES
import { EquipesPage } from './pages/equipes/equipes';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'forgot-password', component: ForgotPassword },

  {
    path: '',
    component: Main,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'clientes', component: Clientes },
      { path: 'produtos', component: Produtos },
      { path: 'encomendas', component: Encomendas },
      { path: 'fornecedores', component: Fornecedores },

      // 2. ADICIONAR A ROTA PARA GESTÃO DE EQUIPES
      // O path deve corresponder ao routerLink="/gestao-equipes" do sidebar
      { path: 'gestao-equipes', component: EquipesPage },

      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '' }
];
