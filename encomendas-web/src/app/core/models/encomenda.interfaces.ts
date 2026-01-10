import { ClienteResponse } from './cliente.interfaces';
import { FornecedorResponse } from './fornecedor.interfaces';
import { ProdutoResponse } from './produto.interfaces';

export interface EncomendaItemRequest {
  produtoId: string;
  fornecedorId: string;
  precoCotado: number;
  quantidade: number;
}

export interface EncomendaItemResponse {
  id: string;
  produto: ProdutoResponse;
  fornecedor: FornecedorResponse;
  quantidade: number;
  precoCotado: number;
  subtotal: number;
}

export interface EncomendaRequest {
  clienteId: string;
  itens: EncomendaItemRequest[];
  status?: string;
  observacoes?: string;

  // --- ENDEREÇO MULTIVALORADO ---
  enderecoCep: string;
  enderecoBairro: string;
  enderecoRua: string;
  enderecoNumero: string;
  enderecoComplemento?: string; // Opcional
  // -----------------------------

  valorAdiantamento?: number;
}

export interface EncomendaResponse {
  id: string;
  cliente: ClienteResponse;
  itens: EncomendaItemResponse[];
  status: string;
  observacoes: string;
  valorTotal: number;
  dataCriacao: string;

  // --- NOVO: Data Estimada para cálculo de atraso ---
  dataEstimadaEntrega?: string;

  // --- ENDEREÇO MULTIVALORADO ---
  enderecoCep: string;
  enderecoBairro: string;
  enderecoRua: string;
  enderecoNumero: string;
  enderecoComplemento?: string;
  // -----------------------------

  valorAdiantamento?: number;
}
