export interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  dataEnvio: string;
  remetenteId?: number;
  remetenteNome?: string;
  destinatarioNome?: string;
}
