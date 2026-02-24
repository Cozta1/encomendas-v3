import { Routes } from '@angular/router';

// Guards
import { authGuard } from './core/auth/auth.guard';

// Layouts (Eager — necessário imediatamente como shell)
import { Main } from './layout/main/main';

// Auth (Eager — necessário imediatamente)
import { Login } from './login/login';
import { Register } from './login/register/register';
import { ForgotPassword } from './login/forgot-password/forgot-password';

export const routes: Routes = [
  // Rotas Públicas
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

  // Rotas Protegidas (Layout Principal)
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
        loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard),
        title: 'Dashboard - Encomendas'
      },

      // --- CADASTROS ---
      {
        path: 'clientes',
        loadComponent: () => import('./pages/clientes/clientes').then(m => m.Clientes),
        title: 'Gestão de Clientes'
      },
      {
        path: 'fornecedores',
        loadComponent: () => import('./pages/fornecedores/fornecedores').then(m => m.Fornecedores),
        title: 'Gestão de Fornecedores'
      },
      {
        path: 'produtos',
        loadComponent: () => import('./pages/produtos/produtos').then(m => m.Produtos),
        title: 'Catálogo de Produtos'
      },

      // --- ENCOMENDAS ---
      {
        path: 'encomendas',
        loadComponent: () => import('./pages/encomendas/encomendas').then(m => m.Encomendas),
        title: 'Minhas Encomendas'
      },
      {
        path: 'encomendas/nova',
        loadComponent: () => import('./pages/encomenda-create/encomenda-create').then(m => m.EncomendaCreate),
        title: 'Nova Encomenda'
      },
      {
        path: 'encomendas/:id',
        loadComponent: () => import('./pages/encomenda-detalhes/encomenda-detalhes').then(m => m.EncomendaDetalhesComponent),
        title: 'Detalhes da Encomenda'
      },

      // --- EQUIPES ---
      {
        path: 'equipes',
        loadComponent: () => import('./pages/equipes/equipes').then(m => m.EquipesPage),
        title: 'Minhas Equipes'
      },
      {
        path: 'gestao-equipes',
        loadComponent: () => import('./pages/gestao-equipe/gestao-equipe').then(m => m.GestaoEquipe),
        title: 'Gerenciar Membros'
      },

      // --- OPERACIONAL (FUNCIONÁRIO) ---
      {
        path: 'checklists',
        loadComponent: () => import('./pages/checklist-dia/checklist-dia').then(m => m.ChecklistDiaComponent),
        title: 'Meu Checklist Diário'
      },
      {
        path: 'meu-calendario',
        loadComponent: () => import('./pages/meu-calendario/meu-calendario').then(m => m.MeuCalendarioComponent),
        title: 'Minha Escala'
      },

      // --- ADMINISTRAÇÃO (GESTOR) ---
      {
        path: 'admin/escalas',
        loadComponent: () => import('./pages/escala-admin/escala-admin').then(m => m.EscalaAdminComponent),
        title: 'Gestão de Escalas'
      },
      {
        path: 'admin/checklists',
        loadComponent: () => import('./pages/checklist-criador/checklist-criador').then(m => m.ChecklistCriadorComponent),
        title: 'Gestor de Checklists'
      },

      // --- CONTA ---
      {
        path: 'perfil',
        loadComponent: () => import('./pages/perfil/perfil').then(m => m.PerfilPage),
        title: 'Meu Perfil'
      }
    ]
  },

  // Wildcard: Se a rota não existe, manda pro login
  {
    path: '**',
    redirectTo: 'login'
  }
];
