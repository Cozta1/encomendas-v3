export interface UsuarioResponse {
  id: number;
  nomeCompleto: string;
  email: string;
  identificacao: string;
  cargo?: string;
  role: string;
  telefone?: string;
  nomeEquipe: string;
  dataCriacao: string;
}

export interface UsuarioUpdate {
  nomeCompleto: string;
  telefone?: string;
  cargo?: string;
  password?: string;
}
