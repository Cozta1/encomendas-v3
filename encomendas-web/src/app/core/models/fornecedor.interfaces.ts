/**
 * DTO que recebemos da API (FornecedorResponseDTO.java)
 */
export interface FornecedorResponse {
  id: string;
  nome: string;
  cnpj: string;
  contatoNome: string;
  telefone: string;
  email: string;
  endereco: string; // Adicionado para corresponder ao DTO de resposta
}

/**
 * DTO que enviamos para criar/atualizar (FornecedorRequestDTO.java)
 */
export interface FornecedorRequest {
  nome: string;
  cnpj?: string;
  contatoNome?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
}
