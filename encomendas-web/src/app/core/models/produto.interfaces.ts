// DTO que recebemos da API
export interface ProdutoResponse {
  id: string;
  nome: string;
  codigo: string;
  descricao: string;
  precoBase: number; // --- RENOMEADO ---
}

// DTO que enviamos para criar/atualizar
export interface ProdutoRequest {
  nome: string;
  codigo?: string;
  descricao?: string;
  preco?: number; // O service.ts do produto ainda espera 'preco', vamos manter por enquanto
}
