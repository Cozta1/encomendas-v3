// DTOs para Anexos
export interface ChecklistAnexo {
  id: string;
  nomeArquivo: string;
  tipoArquivo: string;
  url: string;
}

export interface ChecklistAnexoDTO {
  id: string;
  nomeArquivo: string;
  tipoArquivo: string;
  url: string;
}

// Item do Checklist (Tarefa)
export interface ChecklistItem {
  id: string;
  descricao: string;
  ordem: number;
  marcado: boolean;
}

export interface ChecklistItemDTO {
  id: string;
  descricao: string;
  ordem: number;
  marcado: boolean;
}

// Card (Bloco de Horário / Tarefa Principal)
export interface ChecklistCard {
  id: string;
  titulo: string;
  descricao?: string;
  horarioAbertura: string;
  horarioFechamento: string;
  itens: ChecklistItem[];
  anexos?: ChecklistAnexo[];
  status: 'PENDENTE' | 'ABERTO' | 'FECHADO' | 'HISTORICO' | 'ATRASADO';
}

export interface ChecklistCardDTO {
  id: string;
  titulo: string;
  descricao?: string;
  horarioAbertura: string;
  horarioFechamento: string;
  itens: ChecklistItemDTO[];
  anexos?: ChecklistAnexoDTO[];
  status: string;
}

// Board (Lista de Cards)
export interface ChecklistBoard {
  id: string;
  nome: string;
  equipeId: string;
  usuarioEspecificoId?: number | null;
  cards: ChecklistCard[];
}

export interface ChecklistBoardDTO {
  id: string; // UUID vira string no front
  nome: string;
  equipeId: string;
  usuarioEspecificoId?: number | null;
  cards: ChecklistCardDTO[];
}

// Payload para Logs
export interface ChecklistLogRequest {
  itemId: string;
  dataReferencia: string;
  valor: boolean;
}
