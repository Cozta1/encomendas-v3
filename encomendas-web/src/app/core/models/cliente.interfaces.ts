export interface Endereco {
  id?: string;
  cep: string;
  rua: string;
  bairro: string;
  numero: string;
  complemento?: string;
  cidade?: string;
  uf?: string;
}

export interface ClienteRequest {
  nome: string;
  cpf: string; // Novo
  email: string;
  telefone: string;
  enderecos: Endereco[];
}

export interface ClienteResponse {
  id: string;
  nome: string;
  cpf: string; // Novo
  email: string;
  telefone: string;
  enderecos: Endereco[];
}
