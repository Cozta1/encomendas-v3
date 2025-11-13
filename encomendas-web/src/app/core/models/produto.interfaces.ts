/**
 * DTO que recebemos da API (ProdutoResponseDTO)
 */
export interface ProdutoResponse {
  id: string;
  nome: string;
  codigo: string;
  descricao: string;
  preco: number;
}

/**
 * DTO que enviamos para criar/atualizar (ProdutoRequestDTO)
 */
export interface ProdutoRequest {
  nome: string;
  codigo?: string;
  descricao?: string;
  preco?: number;
}
