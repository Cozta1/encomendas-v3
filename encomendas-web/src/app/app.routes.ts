import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

import { Main } from './layout/main/main';
import { Login } from './login/login';
import { Register } from './login/register/register';
import { ForgotPassword } from './login/forgot-password/forgot-password';

import { Dashboard } from './dashboard/dashboard';
import { Clientes } from './pages/clientes/clientes';
import { Produtos } from './pages/produtos/produtos';
import { Fornecedores } from './pages/fornecedores/fornecedores';
import { GestaoEquipe } from './pages/gestao-equipe/gestao-equipe';
import { Encomendas } from './pages/encomendas/encomendas';
import { EncomendaCreate } from './pages/encomenda-create/encomenda-create';
import { EncomendaDetalhesComponent } from './pages/encomenda-detalhes/encomenda-detalhes';
import { EquipesPage } from './pages/equipes/equipes';
// NOVA IMPORTAÇÃO
import { PerfilPage } from './pages/perfil/perfil';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'forgot-password', component: ForgotPassword },

  {
    path: '',
    component: Main,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard },

      // Nova Rota de Perfil
      { path: 'perfil', component: PerfilPage },

      // Encomendas
      { path: 'encomendas', component: Encomendas },
      { path: 'encomenda-create', component: EncomendaCreate },
      { path: 'encomendas/:id', component: EncomendaDetalhesComponent },

      // Cadastros
      { path: 'clientes', component: Clientes },
      { path: 'produtos', component: Produtos },
      { path: 'fornecedores', component: Fornecedores },

      // Gestão
      { path: 'equipes', component: EquipesPage },
      { path: 'minha-equipe', component: GestaoEquipe }
    ]
  },

  { path: '**', redirectTo: 'login' }
];
