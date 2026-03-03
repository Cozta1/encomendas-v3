export type TipoConversa = 'GRUPO' | 'PRIVADO';
export type TipoAnexo = 'IMG' | 'PDF' | 'DOC' | 'LINK';

export interface MensagemAnexo {
  id?: string;
  nomeArquivo: string;
  tipoArquivo: TipoAnexo;
  url: string;
}

export interface MensagemChat {
  id: string;
  conversaId: string;
  remetenteId: number;
  remetenteNome: string;
  conteudo: string | null;
  enviadoEm: string;
  deletada: boolean;
  anexos: MensagemAnexo[];
}

export interface Conversa {
  id: string;
  tipo: TipoConversa;
  nomeExibicao: string;
  outroUsuarioId?: number;
  ultimaMensagem?: string;
  ultimaMensagemEm?: string;
  naoLidas: number;
}

export interface EnviarMensagemRequest {
  conversaId: string;
  conteudo?: string;
  urlsAnexos?: MensagemAnexo[];
}

export interface UploadedFile {
  id?: string;
  nomeArquivo: string;
  tipoArquivo: TipoAnexo;
  url: string;
}

export interface CriarConversaRequest {
  equipeId: string;
  destinatarioId?: number | null;
}
