export interface ChecklistItem {
  id: string; // UUID
  descricao: string;
  ordem: number;
  marcado: boolean; // Estado calculado do dia
  marcadoPor?: string;
}

export interface ChecklistCard {
  id: string; // UUID
  titulo: string;
  horarioAbertura: string; // 'HH:mm:ss'
  horarioFechamento: string;
  itens: ChecklistItem[];
  status: 'PENDENTE' | 'ABERTO' | 'FECHADO' | 'HISTORICO' | 'ATRASADO'; // Status calculado
}

export interface ChecklistBoard {
  id: string; // UUID
  nome: string;
  equipeId: string;
  cards: ChecklistCard[];
}

// Payload para marcar/desmarcar
export interface ChecklistLogRequest {
  itemId: string;
  dataReferencia: string; // 'yyyy-MM-dd'
  valor: boolean;
}
