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
  data: string; // LocalDate vem como string 'yyyy-MM-dd'
  horarioInicio?: string; // LocalTime vem como string 'HH:mm:ss'
  horarioFim?: string;
  tipo: TipoEscala;
  observacao?: string;
}
