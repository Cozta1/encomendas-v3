import { ClienteResponse } from './cliente.interfaces';
import { FornecedorResponse } from './fornecedor.interfaces'; // 1. Importar
import { ProdutoResponse } from './produto.interfaces';

/**
 * Interface para um item dentro da encomenda (DTO de Request).
 */
export interface EncomendaItemRequest {
  produtoId: string;
  fornecedorId: string; // 2. Adicionar
  precoCotado: number; // 3. Adicionar
  quantidade: number;
}

/**
 * Interface para um item que recebemos da API (DTO de Response).
 */
export interface EncomendaItemResponse {
  id: string;
  produto: ProdutoResponse;
  fornecedor: FornecedorResponse; // 4. Adicionar
  quantidade: number;
  precoCotado: number; // 5. Renomear de precoUnitario
  subtotal: number;
}

/**
 * DTO que enviamos para criar/atualizar uma Encomenda.
 */
export interface EncomendaRequest {
  clienteId: string;
  itens: EncomendaItemRequest[];
  status?: string;
  observacoes?: string;
}

/**
 * DTO que recebemos da API (lista/detalhe).
 */
export interface EncomendaResponse {
  id: string;
  cliente: ClienteResponse;
  itens: EncomendaItemResponse[];
  status: string;
  observacoes: string;
  valorTotal: number;
  dataCriacao: string; // ou Date
}
