import { Endereco } from "./cliente.interfaces"; // Reutiliza a interface de Endereco

export interface FornecedorRequest {
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  enderecos: Endereco[];
}

export interface FornecedorResponse {
  id: string;
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  enderecos: Endereco[];
}
