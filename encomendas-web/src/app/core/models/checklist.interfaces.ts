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
