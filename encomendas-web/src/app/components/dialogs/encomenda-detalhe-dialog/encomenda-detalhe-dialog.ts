import { Component, Inject } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common'; // Adicionar Pipes
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list'; // Importar
import { MatCardModule } from '@angular/material/card'; // Importar
import { MatIconModule } from '@angular/material/icon'; // Importar
import { MatChipsModule } from '@angular/material/chips'; // Importar
import { MatDividerModule } from '@angular/material/divider'; // Importar

import { EncomendaResponse } from '../../../core/models/encomenda.interfaces';

@Component({
  selector: 'app-encomenda-detalhe-dialog',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe, // Adicionar
    CurrencyPipe, // Adicionar
    MatDialogModule,
    MatButtonModule,
    MatListModule, // Adicionar
    MatCardModule, // Adicionar
    MatIconModule, // Adicionar
    MatChipsModule, // Adicionar
    MatDividerModule // Adicionar
  ],
  templateUrl: './encomenda-detalhe-dialog.html',
  styleUrls: ['./encomenda-detalhe-dialog.scss']
})
export class EncomendaDetalheDialog {

  // Recebe a encomenda completa da página 'encomendas.ts'
  constructor(
    public dialogRef: MatDialogRef<EncomendaDetalheDialog>,
    @Inject(MAT_DIALOG_DATA) public encomenda: EncomendaResponse
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }

  // ======================================
  // === LÓGICA ATUALIZADA AQUI ===
  // ======================================
  // Helper para definir a cor do chip com base no status
  getStatusColor(status: string): 'primary' | 'accent' | 'warn' {
    switch (status) {
      case 'Concluído':
        return 'primary';
      case 'Em Preparo':
        return 'accent';
      case 'Aguardando Entrega': // <-- NOVO
        return 'accent';
      case 'Aguardando':
        return 'warn';
      default:
        return 'primary';
    }
  }
}
