export enum TipoEscala {
  TRABALHO = 'TRABALHO',
  FOLGA = 'FOLGA',
  FERIAS = 'FERIAS',
  ATESTADO = 'ATESTADO'
}

export interface EscalaTrabalho {
  id?: number;
  usuarioId: number;
  nomeUsuario?: string;
  data: string;
  horarioInicio?: string;
  horarioFim?: string;
  tipo: TipoEscala;
  observacao?: string;
}

export interface EscalaReplicacao {
  usuarioId: number;
  dataInicio: string;
  dataFim: string;
  diasSemana: number[]; // 1=Seg, 7=Dom
  horarioInicio?: string;
  horarioFim?: string;
  tipo: TipoEscala;
  observacao?: string;
}

export interface EscalaReplicacaoMassa {
  usuarioIds: number[];
  dataInicio: string;
  dataFim: string;
  diasSemana: number[];
  horarioInicio?: string;
  horarioFim?: string;
  tipo: TipoEscala;
  observacao?: string;
}
