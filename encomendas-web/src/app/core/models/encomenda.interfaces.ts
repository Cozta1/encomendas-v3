import { ClienteResponse } from './cliente.interfaces';
import { ProdutoResponse } from './produto.interfaces';

/**
 * Interface para um item dentro da encomenda (DTO de Request).
 */
export interface EncomendaItemRequest {
  produtoId: string;
  quantidade: number;
  precoUnitario?: number; // Opcional, o backend pode calcular
}

/**
 * Interface para um item que recebemos da API (DTO de Response).
 */
export interface EncomendaItemResponse {
  id: string;
  produto: ProdutoResponse;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

/**
 * DTO que enviamos para criar/atualizar uma Encomenda.
 */
export interface EncomendaRequest {
  clienteId: string;
  itens: EncomendaItemRequest[];
  status?: string; // Ex: PENDENTE, CONCLUIDO
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
