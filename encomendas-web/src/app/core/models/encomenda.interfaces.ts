import { ClienteResponse } from './cliente.interfaces';
import { FornecedorResponse } from './fornecedor.interfaces';
import { ProdutoResponse } from './produto.interfaces';

// --- HISTÓRICO ---
export interface EncomendaHistorico {
  status: string;
  dataAlteracao: string;
  nomeUsuario: string;
}

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

  // Endereço
  enderecoCep: string;
  enderecoBairro: string;
  enderecoRua: string;
  enderecoNumero: string;
  enderecoComplemento?: string;

  // Novos Campos Opcionais no Request
  dataEstimadaEntrega?: string;
  notaFutura?: boolean;
  vendaEstoqueNegativo?: boolean;

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

  // Data Estimada para cálculo de atraso
  dataEstimadaEntrega?: string;

  // Histórico de alterações
  historico: EncomendaHistorico[];

  // Endereço
  enderecoCep: string;
  enderecoBairro: string;
  enderecoRua: string;
  enderecoNumero: string;
  enderecoComplemento?: string;

  valorAdiantamento?: number;
}
