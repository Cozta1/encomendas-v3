// DTO que recebemos da API
export interface ClienteResponse {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  cpfCnpj: string;
  endereco: string;
}

// DTO que enviamos para criar/atualizar
export interface ClienteRequest {
  nome: string;
  telefone?: string;
  email?: string;
  cpfCnpj?: string;
  endereco?: string;
}
