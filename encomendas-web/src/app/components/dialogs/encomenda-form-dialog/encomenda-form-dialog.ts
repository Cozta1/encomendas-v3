import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatTable, MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Observable, of } from 'rxjs';
import { startWith, map, catchError, filter } from 'rxjs/operators';
import { MatDividerModule } from '@angular/material/divider';

// Nossos Serviços e Modais
import { ClienteService } from '../../../core/services/cliente.service';
import { ProdutoService } from '../../../core/services/produto.service';
import { FornecedorService } from '../../../core/services/fornecedor.service';
import { ClienteResponse } from '../../../core/models/cliente.interfaces';
import { ProdutoResponse } from '../../../core/models/produto.interfaces';
import { FornecedorResponse } from '../../../core/models/fornecedor.interfaces';
import { EncomendaItemRequest, EncomendaRequest } from '../../../core/models/encomenda.interfaces';
import { ClienteFormDialog } from '../cliente-form-dialog/cliente-form-dialog';

@Component({
  selector: 'app-encomenda-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatAutocompleteModule, MatIconModule,
    MatTableModule, MatSnackBarModule, MatDividerModule
  ],
  templateUrl: './encomenda-form-dialog.html',
  styleUrl: './encomenda-form-dialog.scss'
})
export class EncomendaFormDialog implements OnInit {

  // --- CORREÇÃO: Adicionado '!' para resolver o erro TS2564 ---
  @ViewChild('itensTable') itensTable!: MatTable<FormGroup>;

  // Formulário principal
  encomendaForm: FormGroup;

  // Formulário para adicionar um item
  itemForm: FormGroup;

  // Lista de itens adicionados
  itensDataSource = new FormArray<FormGroup>([]);
  displayedColumns: string[] = ['produto', 'fornecedor', 'quantidade', 'precoCotado', 'subtotal', 'acoes'];

  // Observables para os autocompletes
  filteredClientes$!: Observable<ClienteResponse[]>;
  filteredProdutos$!: Observable<ProdutoResponse[]>;
  filteredFornecedores$!: Observable<FornecedorResponse[]>;

  // Arrays para armazenar os dados completos (cache local)
  private allClientes: ClienteResponse[] = [];
  private allProdutos: ProdutoResponse[] = [];
  private allFornecedores: FornecedorResponse[] = [];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EncomendaFormDialog>,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private clienteService: ClienteService,
    private produtoService: ProdutoService,
    private fornecedorService: FornecedorService
  ) {
    // Formulário principal da encomenda
    this.encomendaForm = this.fb.group({
      cliente: [null, Validators.required],
      observacoes: ['']
    });

    // Formulário para um novo item
    this.itemForm = this.fb.group({
      produto: [null, Validators.required],
      fornecedor: [null, Validators.required],
      quantidade: [1, [Validators.required, Validators.min(1)]],
      precoCotado: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    // 1. Busca os dados completos dos clientes e configura o filtro local
    this.clienteService.getClientes().subscribe(data => {
      this.allClientes = data;
      this.filteredClientes$ = this.encomendaForm.get('cliente')!.valueChanges.pipe(
        startWith(''),
        map(value => {
          const nome = typeof value === 'string' ? value : value?.nome || '';
          return nome ? this._filterClientes(nome) : this.allClientes.slice();
        })
      );
    });

    // 2. Busca os dados completos dos produtos e configura o filtro local
    this.produtoService.getProdutos().subscribe(data => {
      this.allProdutos = data;
      this.filteredProdutos$ = this.itemForm.get('produto')!.valueChanges.pipe(
        startWith(''),
        map(value => {
          const nome = typeof value === 'string' ? value : value?.nome || '';
          return nome ? this._filterProdutos(nome) : this.allProdutos.slice();
        })
      );
    });

    // 3. Busca os dados completos dos fornecedores e configura o filtro local
    this.fornecedorService.getFornecedores().subscribe(data => {
      this.allFornecedores = data;
      this.filteredFornecedores$ = this.itemForm.get('fornecedor')!.valueChanges.pipe(
        startWith(''),
        map(value => {
          const nome = typeof value === 'string' ? value : value?.nome || '';
          return nome ? this._filterFornecedores(nome) : this.allFornecedores.slice();
        })
      );
    });

    // 4. Ouve a seleção de produtos para preencher o preço cotado
    this.observeProdutoChanges();
  }

  // Métodos privados para filtragem local
  private _filterClientes(value: string): ClienteResponse[] {
    const filterValue = value.toLowerCase();
    return this.allClientes.filter(cliente => cliente.nome.toLowerCase().includes(filterValue));
  }

  private _filterProdutos(value: string): ProdutoResponse[] {
    const filterValue = value.toLowerCase();
    return this.allProdutos.filter(produto => produto.nome.toLowerCase().includes(filterValue));
  }

  private _filterFornecedores(value: string): FornecedorResponse[] {
    const filterValue = value.toLowerCase();
    return this.allFornecedores.filter(fornecedor => fornecedor.nome.toLowerCase().includes(filterValue));
  }

  /**
   * Observa mudanças no campo 'produto' do itemForm.
   * Quando um produto é selecionado (é um objeto),
   * atualiza o 'precoCotado' com o 'precoBase' do produto.
   */
  private observeProdutoChanges(): void {
    this.itemForm.get('produto')?.valueChanges.pipe(
      // Filtra para que só reaja a objetos (seleções) e não a strings (digitação)
      filter(value => typeof value === 'object' && value !== null)
    ).subscribe((produto: ProdutoResponse) => {
      // Define o 'precoCotado' com o 'precoBase' do produto
      this.itemForm.get('precoCotado')?.setValue(produto.precoBase);
    });
  }


  // Funções 'displayWith' para os autocompletes mostrarem o nome
  displayClienteFn(cliente: ClienteResponse): string {
    return cliente && cliente.nome ? cliente.nome : '';
  }
  displayProdutoFn(produto: ProdutoResponse): string {
    return produto && produto.nome ? produto.nome : '';
  }
  displayFornecedorFn(fornecedor: FornecedorResponse): string {
    return fornecedor && fornecedor.nome ? fornecedor.nome : '';
  }

  // --- Abrir modal de novo cliente ---
  abrirModalNovoCliente(event: MouseEvent): void {
    event.stopPropagation(); // Impede o autocomplete de fechar
    const dialogRef = this.dialog.open(ClienteFormDialog, {
      width: '500px',
      data: null // Modo de criação
    });

    dialogRef.afterClosed().subscribe(novoClienteRequest => {
      if (novoClienteRequest) {
        // Se o cliente foi criado, chamamos o serviço
        this.clienteService.criarCliente(novoClienteRequest).subscribe(clienteCriado => {
          this.snackBar.open('Cliente criado e selecionado!', 'OK', { duration: 3000 });

          // Adiciona o novo cliente à lista local
          this.allClientes.push(clienteCriado);
          // Atualiza o valor do formControl (o que dispara o 'valueChanges' e atualiza a lista)
          this.encomendaForm.get('cliente')?.setValue(clienteCriado);
        });
      }
    });
  }

  // --- MÉTODO ATUALIZADO ---
  adicionarItem(): void {
    if (this.itemForm.invalid) return;

    const item = this.itemForm.value;
    const subtotal = item.quantidade * item.precoCotado;

    // Adiciona o item formatado ao FormArray
    this.itensDataSource.push(this.fb.group({
      produto: [item.produto, Validators.required],
      fornecedor: [item.fornecedor, Validators.required],
      quantidade: [item.quantidade, Validators.required],
      precoCotado: [item.precoCotado, Validators.required],
      subtotal: [subtotal] // Campo calculado
    }));

    // --- FORÇA O REDESENHO DA TABELA ---
    if (this.itensTable) {
      this.itensTable.renderRows();
    }
    // --- FIM DA CORREÇÃO ---

    // Reseta o formulário de adicionar item
    this.itemForm.reset({
      produto: null,
      fornecedor: null,
      quantidade: 1,
      precoCotado: 0
    });
  }

  // --- MÉTODO ATUALIZADO ---
  removerItem(index: number): void {
    this.itensDataSource.removeAt(index);

    // --- FORÇA O REDESENHO DA TABELA ---
    if (this.itensTable) {
      this.itensTable.renderRows();
    }
  }

  // Função helper para recalcular o total
  getValorTotalEncomenda(): number {
    return this.itensDataSource.controls
      .reduce((acc, itemForm) => acc + (itemForm.get('subtotal')?.value || 0), 0);
  }

  // Fecha o modal e retorna os dados
  onSave(): void {
    if (this.encomendaForm.invalid || this.itensDataSource.length === 0) {
      this.snackBar.open('Selecione um cliente e adicione pelo menos um item.', 'Fechar', { duration: 3000 });
      return;
    }

    // Pega os dados brutos dos formulários
    const clienteSelecionado: ClienteResponse = this.encomendaForm.get('cliente')?.value;
    const observacoes: string = this.encomendaForm.get('observacoes')?.value;

    // Mapeia os itens do FormArray para o DTO de Request
    const itensRequest: EncomendaItemRequest[] = this.itensDataSource.controls.map(itemGroup => {
      const produto: ProdutoResponse = itemGroup.get('produto')?.value;
      const fornecedor: FornecedorResponse = itemGroup.get('fornecedor')?.value;

      return {
        produtoId: produto.id,
        fornecedorId: fornecedor.id,
        quantidade: itemGroup.get('quantidade')?.value,
        precoCotado: itemGroup.get('precoCotado')?.value
      };
    });

    // Monta o DTO final
    const encomendaRequest: EncomendaRequest = {
      clienteId: clienteSelecionado.id,
      observacoes: observacoes,
      itens: itensRequest
    };

    this.dialogRef.close(encomendaRequest);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
