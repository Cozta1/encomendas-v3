import { Routes } from '@angular/router';
import { Login} from './login/login';
import { Main } from './layout/main/main';
import { Dashboard } from './dashboard/dashboard';
import { authGuard } from './core/auth/auth.guard';

// Importe os novos componentes
import { Clientes } from './pages/clientes/clientes';
import { Produtos } from './pages/produtos/produtos';
import { Encomendas } from './pages/encomendas/encomendas';
import { Fornecedores } from './pages/fornecedores/fornecedores';

import { Register } from './login/register'; // Importar
import { ForgotPassword } from './login/forgot-password'; // Importar

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

      // --- ADICIONE ESTAS ROTAS ---
      { path: 'clientes', component: Clientes },
      { path: 'produtos', component: Produtos },
      { path: 'encomendas', component: Encomendas },
      { path: 'fornecedores', component: Fornecedores },
      // -----------------------------

      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '' }
];
