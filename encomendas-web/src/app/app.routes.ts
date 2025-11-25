import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Main } from './layout/main/main';
import { Dashboard } from './dashboard/dashboard';
import { authGuard } from './core/auth/auth.guard';

// Importar as páginas do sistema
import { Clientes } from './pages/clientes/clientes';
import { Produtos } from './pages/produtos/produtos';
import { Encomendas } from './pages/encomendas/encomendas';
import { Fornecedores } from './pages/fornecedores/fornecedores';

// --- CORREÇÃO: IMPORTAR COMPONENTES DE LOGIN ---
import { Register } from './login/register/register';
import { ForgotPassword } from './login/forgot-password/forgot-password';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'register', component: Register }, // Nova rota
  { path: 'forgot-password', component: ForgotPassword }, // Nova rota

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
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '' }
];
