export interface ChecklistBoard {
  id: string;
  nome: string;
  equipeId: string;
  usuarioEspecificoId?: number;
  cards: ChecklistCard[];
  ordem?: number; // Campo adicionado
}

export interface ChecklistCard {
  id: string;
  titulo: string;
  descricao?: string;
  horarioAbertura: string;   // "HH:mm"
  horarioFechamento: string; // "HH:mm"
  status: 'ABERTO' | 'FECHADO' | 'PENDENTE' | 'HISTORICO' | 'CONFIG'; // Status calculado no backend
  itens: ChecklistItem[];
  anexos: ChecklistAnexo[];
  ordem?: number; // Campo adicionado
}

export interface ChecklistItem {
  id: string;
  descricao: string;
  marcado: boolean;
  ordem?: number; // Campo adicionado (caso queira ordenar itens também)
}

export interface ChecklistAnexo {
  id: string;
  nomeArquivo: string;
  url: string;
  tipo: string;
}

export interface ChecklistLogRequest {
  itemId: string;
  dataReferencia: string; // "YYYY-MM-DD"
  valor: boolean;
}

// --- Relatório de Atividades ---

export interface ChecklistRelatorio {
  data: string;
  usuarios: RelatorioUsuario[];
}

export interface RelatorioUsuario {
  usuarioId: number;
  nomeUsuario: string;
  totalItens: number;
  totalMarcados: number;
  boards: RelatorioBoard[];
}

export interface RelatorioBoard {
  boardNome: string;
  cards: RelatorioCard[];
}

export interface RelatorioCard {
  cardTitulo: string;
  horarioAbertura: string;
  horarioFechamento: string;
  itens: RelatorioItem[];
  statusCard?: 'CONCLUIDA' | 'ABERTA' | 'FECHADA_INCOMPLETA' | 'PENDENTE' | 'SEM_ITENS';
}

export interface RelatorioItem {
  descricao: string;
  marcado: boolean;
  horaPreenchimento?: string;
}
