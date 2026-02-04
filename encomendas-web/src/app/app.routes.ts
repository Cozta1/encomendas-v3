import { Routes } from '@angular/router';

// Guards
import { authGuard } from './core/auth/auth.guard';

// Layouts
import { Main } from './layout/main/main';

// Auth
import { Login } from './login/login';
import { Register } from './login/register/register';
import { ForgotPassword } from './login/forgot-password/forgot-password';

// Dashboard e Cadastros
import { Dashboard } from './dashboard/dashboard';
import { Clientes } from './pages/clientes/clientes';
import { Fornecedores } from './pages/fornecedores/fornecedores';
import { Produtos } from './pages/produtos/produtos';
import { PerfilPage } from './pages/perfil/perfil';

// Encomendas
import { Encomendas } from './pages/encomendas/encomendas';
import { EncomendaCreate } from './pages/encomenda-create/encomenda-create';
import { EncomendaDetalhesComponent } from './pages/encomenda-detalhes/encomenda-detalhes';

// Equipes
import { EquipesPage } from './pages/equipes/equipes';
import { GestaoEquipe } from './pages/gestao-equipe/gestao-equipe';

// Operacional (Funcionário)
import { ChecklistDiaComponent } from './pages/checklist-dia/checklist-dia';
import { MeuCalendarioComponent } from './pages/meu-calendario/meu-calendario';

// Administração (Gestor) - NOVAS IMPORTAÇÕES
import { EscalaAdminComponent } from './pages/escala-admin/escala-admin';
import { ChecklistCriadorComponent } from './pages/checklist-criador/checklist-criador';

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
        component: Dashboard,
        title: 'Dashboard - Encomendas'
      },

      // --- CADASTROS ---
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

      // --- ENCOMENDAS ---
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
        component: EncomendaDetalhesComponent,
        title: 'Detalhes da Encomenda'
      },

      // --- EQUIPES ---
      {
        path: 'equipes',
        component: EquipesPage,
        title: 'Minhas Equipes'
      },
      {
        path: 'gestao-equipes',
        component: GestaoEquipe,
        title: 'Gerenciar Membros'
      },

      // --- OPERACIONAL (FUNCIONÁRIO) ---
      {
        path: 'checklists',
        component: ChecklistDiaComponent,
        title: 'Meu Checklist Diário'
      },
      {
        path: 'meu-calendario',
        component: MeuCalendarioComponent,
        title: 'Minha Escala'
      },

      // --- ADMINISTRAÇÃO (GESTOR) ---
      {
        path: 'admin/escalas',
        component: EscalaAdminComponent,
        title: 'Gestão de Escalas'
      },
      {
        path: 'admin/checklists',
        component: ChecklistCriadorComponent,
        title: 'Gestor de Checklists'
      },

      // --- CONTA ---
      {
        path: 'perfil',
        component: PerfilPage,
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
