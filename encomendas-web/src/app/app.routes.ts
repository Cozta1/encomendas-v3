import { Routes } from '@angular/router';

// Guards
import { authGuard } from './core/auth/auth.guard';

// Layouts
import { Main } from './layout/main/main';

// Auth
import { Login } from './login/login';
import { Register } from './login/register/register';
import { ForgotPassword } from './login/forgot-password/forgot-password';

// Dashboard e Cadastros (Nomes assumidos como corretos pois não deram erro no último log)
import { Dashboard } from './dashboard/dashboard';
import { Clientes } from './pages/clientes/clientes';
import { Fornecedores } from './pages/fornecedores/fornecedores';
import { Produtos } from './pages/produtos/produtos';

// --- CORREÇÃO AQUI: PerfilPage ---
import { PerfilPage } from './pages/perfil/perfil'; //

// Encomendas
import { Encomendas } from './pages/encomendas/encomendas';
import { EncomendaCreate } from './pages/encomenda-create/encomenda-create';
// --- CORREÇÃO AQUI: EncomendaDetalhesComponent ---
import { EncomendaDetalhesComponent } from './pages/encomenda-detalhes/encomenda-detalhes'; //

// Equipes
// --- CORREÇÃO AQUI: EquipesPage ---
import { EquipesPage } from './pages/equipes/equipes'; //
import { GestaoEquipe } from './pages/gestao-equipe/gestao-equipe';

// Checklist (Novo componente criado hoje)
import { ChecklistDiaComponent } from './pages/checklist-dia/checklist-dia';

import { MeuCalendarioComponent } from './pages/meu-calendario/meu-calendario';
import { EscalaAdminComponent } from './pages/escala-admin/escala-admin';

export const routes: Routes = [
  {
    path: 'login',
    component: Login
  },
  {
    path: 'register',
    component: Register
  },
  {
    path: 'forgot-password',
    component: ForgotPassword
  },

  {
    path: '',
    component: Main,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: Dashboard,
        title: 'Dashboard - Encomendas'
      },

      {
        path: 'clientes',
        component: Clientes,
        title: 'Gestão de Clientes'
      },
      {
        path: 'fornecedores',
        component: Fornecedores,
        title: 'Gestão de Fornecedores'
      },
      {
        path: 'produtos',
        component: Produtos,
        title: 'Catálogo de Produtos'
      },

      {
        path: 'encomendas',
        component: Encomendas,
        title: 'Minhas Encomendas'
      },
      {
        path: 'encomendas/nova',
        component: EncomendaCreate,
        title: 'Nova Encomenda'
      },
      {
        path: 'encomendas/:id',
        component: EncomendaDetalhesComponent, // Classe corrigida
        title: 'Detalhes da Encomenda'
      },

      {
        path: 'equipes',
        component: EquipesPage, // Classe corrigida
        title: 'Minhas Equipes'
      },
      {
        path: 'gestao-equipes',
        component: GestaoEquipe,
        title: 'Gerenciar Membros'
      },

      {
        path: 'checklists',
        component: ChecklistDiaComponent,
        title: 'Meu Checklist Diário'
      },

      {
        path: 'perfil',
        component: PerfilPage, // Classe corrigida
        title: 'Meu Perfil'
      },
      {
        path: 'meu-calendario',
        component: MeuCalendarioComponent,
        title: 'Minha Escala'
      },
      {
        path: 'admin/escalas',
        component: EscalaAdminComponent,
        title: 'Gestão de Escalas'
      },
    ]
  },

  {
    path: '**',
    redirectTo: 'login'
  }
];
