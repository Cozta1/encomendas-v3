import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Observable, of, switchMap } from 'rxjs';
import { EncomendaService } from '../../core/services/encomenda.service';
import { EncomendaResponse } from '../../core/models/encomenda.interfaces';

// Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-encomenda-detalhes',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatButtonModule,
    MatIconModule, MatStepperModule, MatTableModule, MatDividerModule,
    MatSnackBarModule, MatListModule
  ],
  providers: [DatePipe, CurrencyPipe],
  templateUrl: './encomenda-detalhes.html',
  styleUrls: ['./encomenda-detalhes.scss']
})
export class EncomendaDetalhesComponent implements OnInit {

  encomenda$!: Observable<EncomendaResponse>;

  constructor(
    private route: ActivatedRoute,
    private encomendaService: EncomendaService,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe,
    private currencyPipe: CurrencyPipe
  ) {}

  ngOnInit(): void {
    this.encomenda$ = this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (id) {
          return this.encomendaService.getEncomendaById(id);
        }
        throw new Error('ID não fornecido');
      })
    );
  }

  // --- Helpers de Visualização ---

  getStepIndex(status: string): number {
    switch(status) {
      case 'Encomenda Criada': return 0;
      case 'Mercadoria em Loja': return 1;
      case 'Aguardando Entrega': return 2;
      case 'Concluído': return 3;
      default: return 0;
    }
  }

  getLogHistorico(encomenda: EncomendaResponse): any[] {
    if (!encomenda.historico || encomenda.historico.length === 0) return [];

    const historicoOrdenado = [...encomenda.historico].sort((a, b) =>
      new Date(a.dataAlteracao).getTime() - new Date(b.dataAlteracao).getTime()
    );

    const logs = historicoOrdenado.map((h, index) => {
      const statusAnterior = index > 0 ? historicoOrdenado[index - 1].status : 'Início';
      const statusAtual = h.status;

      let textoTransicao = '';
      if (index === 0) {
        textoTransicao = `Encomenda criada como '${statusAtual}'`;
      } else {
        textoTransicao = `${statusAnterior} ➝ ${statusAtual}`;
      }

      return {
        ...h,
        transicao: textoTransicao
      };
    });

    return logs.reverse();
  }

  verificarAtraso(encomenda: EncomendaResponse): boolean {
    if (!encomenda.dataEstimadaEntrega || encomenda.status === 'Concluído' || encomenda.status === 'Cancelado') return false;
    return new Date(encomenda.dataEstimadaEntrega) < new Date();
  }

  // --- PDF ---

  async gerarPDF(encomenda: EncomendaResponse): Promise<void> {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF();
    let cursorY = 20;

    // Cabeçalho
    doc.setFontSize(18);
    doc.text('Resumo da Encomenda', 14, cursorY);
    cursorY += 6;

    doc.setFontSize(10);
    doc.setTextColor(100);
    const dataFormatada = this.datePipe.transform(encomenda.dataCriacao, 'dd/MM/yyyy HH:mm');
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, cursorY);
    cursorY += 5;
    doc.text(`Pedido criado em: ${dataFormatada}`, 14, cursorY);
    cursorY += 10;

    // Cliente
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Cliente: ${encomenda.cliente.nome}`, 14, cursorY);
    cursorY += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    if (encomenda.cliente.email) {
      doc.text(`Email: ${encomenda.cliente.email}`, 14, cursorY);
      cursorY += 5;
    }
    if (encomenda.cliente.telefone) {
      doc.text(`Telefone: ${encomenda.cliente.telefone}`, 14, cursorY);
      cursorY += 5;
    }
    cursorY += 2;

    doc.setFontSize(12);
    doc.text(`Status Atual: ${encomenda.status}`, 14, cursorY);
    cursorY += 10;

    // Endereço
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text('Endereço de Entrega:', 14, cursorY);
    cursorY += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const enderecoCompleto = `${encomenda.enderecoRua}, ${encomenda.enderecoNumero}${encomenda.enderecoComplemento ? ' - ' + encomenda.enderecoComplemento : ''}`;
    const bairroCep = `${encomenda.enderecoBairro} - CEP: ${encomenda.enderecoCep}`;

    doc.text(enderecoCompleto, 14, cursorY);
    cursorY += 5;
    doc.text(bairroCep, 14, cursorY);
    cursorY += 10;

    // Observações
    if (encomenda.observacoes) {
      doc.setFont("helvetica", "italic");
      const splitObs = doc.splitTextToSize(`Obs: ${encomenda.observacoes}`, 180);
      doc.text(splitObs, 14, cursorY);
      cursorY += (splitObs.length * 5) + 5;
      doc.setFont("helvetica", "normal");
    }

    // Tabela
    const head = [['Produto', 'Fornecedor', 'Qtd', 'Preço Unit.', 'Subtotal']];
    const data = encomenda.itens.map(item => [
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
      headStyles: { fillColor: [63, 81, 181] }
    });

    // Totais
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(11);
    doc.text(`Total Bruto: ${this.currencyPipe.transform(encomenda.valorTotal, 'BRL')}`, 140, finalY, { align: 'right' });

    if (encomenda.valorAdiantamento && encomenda.valorAdiantamento > 0) {
      doc.setTextColor(0, 128, 0);
      doc.text(`Adiantamento: -${this.currencyPipe.transform(encomenda.valorAdiantamento, 'BRL')}`, 140, finalY + 6, { align: 'right' });

      doc.setTextColor(200, 0, 0);
      const restante = encomenda.valorTotal - encomenda.valorAdiantamento;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Restante: ${this.currencyPipe.transform(restante, 'BRL')}`, 140, finalY + 14, { align: 'right' });
    }

    const nomeArquivo = `encomenda_${encomenda.cliente.nome.replace(/\s+/g, '_')}_${this.datePipe.transform(new Date(), 'ddMMyy')}.pdf`;
    doc.save(nomeArquivo);
  }

  // --- Ações ---

  avancar(encomenda: EncomendaResponse) {
    this.encomendaService.avancarEtapa(encomenda.id).subscribe({
      next: (updated) => {
        this.encomenda$ = of(updated);
        this.snackBar.open('Status atualizado!', 'OK', { duration: 2000 });
      },
      error: () => this.snackBar.open('Erro ao atualizar.', 'Fechar')
    });
  }

  cancelar(encomenda: EncomendaResponse) {
    if(confirm('Deseja realmente cancelar?')) {
      this.encomendaService.cancelarEncomenda(encomenda.id).subscribe({
        next: (updated) => {
          this.encomenda$ = of(updated);
          this.snackBar.open('Encomenda cancelada.', 'OK', { duration: 2000 });
        },
        error: () => this.snackBar.open('Erro ao cancelar.', 'Fechar')
      });
    }
  }

  // --- REATIVAR ---
  reativar(encomenda: EncomendaResponse) {
    if(confirm('Deseja reativar esta encomenda? Ela voltará para o status "Criada".')) {
      this.encomendaService.descancelarEncomenda(encomenda.id).subscribe({
        next: (updated) => {
          this.encomenda$ = of(updated);
          this.snackBar.open('Encomenda reativada com sucesso!', 'OK', { duration: 2000 });
        },
        error: () => this.snackBar.open('Erro ao reativar encomenda.', 'Fechar')
      });
    }
  }
}
