import { Component, Inject } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { EncomendaResponse } from '../../../core/models/encomenda.interfaces';

@Component({
  selector: 'app-encomenda-detalhe-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatListModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule
  ],
  providers: [DatePipe, CurrencyPipe],
  templateUrl: './encomenda-detalhe-dialog.html',
  styleUrls: ['./encomenda-detalhe-dialog.scss']
})
export class EncomendaDetalheDialog {

  constructor(
    public dialogRef: MatDialogRef<EncomendaDetalheDialog>,
    @Inject(MAT_DIALOG_DATA) public encomenda: EncomendaResponse,
    private datePipe: DatePipe,
    private currencyPipe: CurrencyPipe
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }

  getStatusColor(status: string): 'primary' | 'accent' | 'warn' {
    switch (status) {
      case 'Concluído': return 'primary';
      case 'Em Preparo': return 'accent';
      case 'Aguardando Entrega': return 'accent';
      case 'Pendente': return 'warn';
      default: return 'primary';
    }
  }

  gerarPDF(): void {
    const doc = new jsPDF();
    let cursorY = 20; // Posição vertical inicial

    // 1. Cabeçalho
    doc.setFontSize(18);
    doc.text('Resumo da Encomenda', 14, cursorY);
    cursorY += 6;

    doc.setFontSize(10);
    doc.setTextColor(100);
    const dataFormatada = this.datePipe.transform(this.encomenda.dataCriacao, 'dd/MM/yyyy HH:mm');
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, cursorY);
    cursorY += 5;
    doc.text(`Pedido criado em: ${dataFormatada}`, 14, cursorY);
    cursorY += 10; // Espaço antes dos dados do cliente

    // 2. Dados do Cliente (Com Email e Telefone)
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Cliente: ${this.encomenda.cliente.nome}`, 14, cursorY);
    cursorY += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    if (this.encomenda.cliente.email) {
      doc.text(`Email: ${this.encomenda.cliente.email}`, 14, cursorY);
      cursorY += 5;
    }
    if (this.encomenda.cliente.telefone) {
      doc.text(`Telefone: ${this.encomenda.cliente.telefone}`, 14, cursorY);
      cursorY += 5;
    }
    cursorY += 2; // Espaço extra

    // Status
    doc.setFontSize(12);
    doc.text(`Status: ${this.encomenda.status}`, 14, cursorY);
    cursorY += 10;

    // 3. Endereço
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text('Endereço de Entrega:', 14, cursorY);
    cursorY += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const end = this.encomenda;
    const enderecoCompleto = `${end.enderecoRua}, ${end.enderecoNumero}${end.enderecoComplemento ? ' - ' + end.enderecoComplemento : ''}`;
    const bairroCep = `${end.enderecoBairro} - CEP: ${end.enderecoCep}`;

    doc.text(enderecoCompleto, 14, cursorY);
    cursorY += 5;
    doc.text(bairroCep, 14, cursorY);
    cursorY += 10;

    // 4. Observações (se houver)
    if (this.encomenda.observacoes) {
      doc.setFont("helvetica", "italic");
      doc.text(`Obs: ${this.encomenda.observacoes}`, 14, cursorY);
      doc.setFont("helvetica", "normal");
      cursorY += 10;
    }

    // 5. Tabela de Itens
    const head = [['Produto', 'Fornecedor', 'Qtd', 'Preço Unit.', 'Subtotal']];
    const data = this.encomenda.itens.map(item => [
      item.produto.nome,
      item.fornecedor.nome,
      item.quantidade,
      this.currencyPipe.transform(item.precoCotado, 'BRL'),
      this.currencyPipe.transform(item.subtotal, 'BRL')
    ]);

    autoTable(doc, {
      startY: cursorY,
      head: head,
      body: data,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [63, 81, 181] } // Indigo
    });

    // 6. Totais
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(11);
    doc.text(`Total Bruto: ${this.currencyPipe.transform(this.encomenda.valorTotal, 'BRL')}`, 140, finalY, { align: 'right' });

    if (this.encomenda.valorAdiantamento && this.encomenda.valorAdiantamento > 0) {
      doc.setTextColor(0, 128, 0); // Verde
      doc.text(`Adiantamento: -${this.currencyPipe.transform(this.encomenda.valorAdiantamento, 'BRL')}`, 140, finalY + 6, { align: 'right' });

      doc.setTextColor(200, 0, 0); // Vermelho
      const restante = this.encomenda.valorTotal - this.encomenda.valorAdiantamento;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Restante: ${this.currencyPipe.transform(restante, 'BRL')}`, 140, finalY + 14, { align: 'right' });
    }

    // 7. Salvar
    const nomeArquivo = `encomenda_${this.encomenda.cliente.nome.replace(/\s+/g, '_')}_${this.datePipe.transform(new Date(), 'ddMMyy')}.pdf`;
    doc.save(nomeArquivo);
  }
}
