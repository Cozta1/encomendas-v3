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
import { Observable } from 'rxjs';
import { startWith, map, filter, debounceTime, switchMap } from 'rxjs/operators';
import { MatDividerModule } from '@angular/material/divider';

import { ClienteService } from '../../../core/services/cliente.service';
import { ProdutoService } from '../../../core/services/produto.service';
import { FornecedorService } from '../../../core/services/fornecedor.service';
import { CepService, ViaCepResponse } from '../../../core/services/cep.service';

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

  @ViewChild('itensTable') itensTable!: MatTable<FormGroup>;

  encomendaForm: FormGroup;
  itemForm: FormGroup;
  itensDataSource = new FormArray<FormGroup>([]);
  displayedColumns: string[] = ['produto', 'fornecedor', 'quantidade', 'precoCotado', 'subtotal', 'acoes'];

  filteredClientes$!: Observable<ClienteResponse[]>;
  filteredProdutos$!: Observable<ProdutoResponse[]>;
  filteredFornecedores$!: Observable<FornecedorResponse[]>;

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
    private fornecedorService: FornecedorService,
    private cepService: CepService
  ) {
    this.encomendaForm = this.fb.group({
      cliente: [null, Validators.required],
      enderecoCep: ['', [Validators.required, Validators.minLength(8)]],
      enderecoBairro: ['', Validators.required],
      enderecoRua: ['', Validators.required],
      enderecoNumero: ['', Validators.required],
      enderecoComplemento: [''],
      valorAdiantamento: [null, Validators.min(0)],
      observacoes: ['']
    });

    this.itemForm = this.fb.group({
      produto: [null, Validators.required],
      fornecedor: [null, Validators.required],
      quantidade: [1, [Validators.required, Validators.min(1)]],
      precoCotado: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.carregarDadosIniciais();
    this.observeProdutoChanges();
    this.setupCepListener();
  }

  private carregarDadosIniciais(): void {
    this.clienteService.getClientes().subscribe(data => {
      this.allClientes = data;
      this.filteredClientes$ = this.encomendaForm.get('cliente')!.valueChanges.pipe(
        startWith(''),
        map(value => typeof value === 'string' ? value : value?.nome || ''),
        map(nome => nome ? this._filterClientes(nome) : this.allClientes.slice())
      );
    });

    this.produtoService.getProdutos().subscribe(data => {
      this.allProdutos = data;
      this.filteredProdutos$ = this.itemForm.get('produto')!.valueChanges.pipe(
        startWith(''),
        map(value => typeof value === 'string' ? value : value?.nome || ''),
        map(nome => nome ? this._filterProdutos(nome) : this.allProdutos.slice())
      );
    });

    this.fornecedorService.getFornecedores().subscribe(data => {
      this.allFornecedores = data;
      this.filteredFornecedores$ = this.itemForm.get('fornecedor')!.valueChanges.pipe(
        startWith(''),
        map(value => typeof value === 'string' ? value : value?.nome || ''),
        map(nome => nome ? this._filterFornecedores(nome) : this.allFornecedores.slice())
      );
    });
  }

  private setupCepListener(): void {
    this.encomendaForm.get('enderecoCep')?.valueChanges.pipe(
      debounceTime(300),
      filter(value => value && value.replace(/\D/g, '').length === 8),
      switchMap(cep => this.cepService.buscarCep(cep))
    ).subscribe((response: ViaCepResponse | null) => {
      if (response && !response.erro) {
        this.encomendaForm.patchValue({
          enderecoRua: response.logradouro,
          enderecoBairro: response.bairro,
        });
        this.snackBar.open(`Endereço encontrado: ${response.localidade}-${response.uf}`, 'OK', { duration: 2000 });
      } else if (response && response.erro) {
        this.snackBar.open('CEP não encontrado.', 'Fechar', { duration: 3000 });
        this.limparEndereco();
      }
    });
  }

  private limparEndereco(): void {
    this.encomendaForm.patchValue({
      enderecoRua: '',
      enderecoBairro: '',
      enderecoComplemento: ''
    });
  }

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

  private observeProdutoChanges(): void {
    this.itemForm.get('produto')?.valueChanges.pipe(
      filter(value => typeof value === 'object' && value !== null)
    ).subscribe((produto: ProdutoResponse) => {
      this.itemForm.get('precoCotado')?.setValue(produto.precoBase);
    });
  }

  displayClienteFn(cliente: ClienteResponse): string { return cliente && cliente.nome ? cliente.nome : ''; }
  displayProdutoFn(produto: ProdutoResponse): string { return produto && produto.nome ? produto.nome : ''; }
  displayFornecedorFn(fornecedor: FornecedorResponse): string { return fornecedor && fornecedor.nome ? fornecedor.nome : ''; }

  abrirModalNovoCliente(event: MouseEvent): void {
    event.stopPropagation();
    const dialogRef = this.dialog.open(ClienteFormDialog, { width: '500px', data: null });
    dialogRef.afterClosed().subscribe(novoClienteRequest => {
      if (novoClienteRequest) {
        this.clienteService.criarCliente(novoClienteRequest).subscribe(clienteCriado => {
          this.snackBar.open('Cliente criado!', 'OK', { duration: 3000 });
          this.allClientes.push(clienteCriado);
          this.encomendaForm.get('cliente')?.setValue(clienteCriado);
        });
      }
    });
  }

  adicionarItem(): void {
    if (this.itemForm.invalid) return;
    const item = this.itemForm.value;
    const subtotal = item.quantidade * item.precoCotado;

    this.itensDataSource.push(this.fb.group({
      produto: [item.produto, Validators.required],
      fornecedor: [item.fornecedor, Validators.required],
      quantidade: [item.quantidade, Validators.required],
      precoCotado: [item.precoCotado, Validators.required],
      subtotal: [subtotal]
    }));

    if (this.itensTable) this.itensTable.renderRows();
    this.itemForm.reset({ produto: null, fornecedor: null, quantidade: 1, precoCotado: 0 });
  }

  removerItem(index: number): void {
    this.itensDataSource.removeAt(index);
    if (this.itensTable) this.itensTable.renderRows();
  }

  getValorTotalEncomenda(): number {
    return this.itensDataSource.controls.reduce((acc, itemForm) => acc + (itemForm.get('subtotal')?.value || 0), 0);
  }

  onSave(): void {
    if (this.encomendaForm.invalid || this.itensDataSource.length === 0) {
      this.snackBar.open('Preencha os campos obrigatórios e adicione itens.', 'Fechar', { duration: 3000 });
      this.encomendaForm.markAllAsTouched();
      return;
    }

    const totalEncomenda = this.getValorTotalEncomenda();
    const valorAdiantamento = this.encomendaForm.get('valorAdiantamento')?.value || 0;

    // --- NOVA VALIDAÇÃO ---
    if (valorAdiantamento > totalEncomenda) {
      this.snackBar.open(
        `O adiantamento (R$ ${valorAdiantamento}) não pode ser maior que o total (R$ ${totalEncomenda}).`,
        'Corrigir',
        { duration: 5000 }
      );
      return;
    }
    // ----------------------

    const clienteSelecionado: ClienteResponse = this.encomendaForm.get('cliente')?.value;

    const itensRequest: EncomendaItemRequest[] = this.itensDataSource.controls.map(group => {
      return {
        produtoId: group.get('produto')?.value.id,
        fornecedorId: group.get('fornecedor')?.value.id,
        quantidade: group.get('quantidade')?.value,
        precoCotado: group.get('precoCotado')?.value
      };
    });

    const encomendaRequest: EncomendaRequest = {
      clienteId: clienteSelecionado.id,
      observacoes: this.encomendaForm.get('observacoes')?.value,
      enderecoCep: this.encomendaForm.get('enderecoCep')?.value,
      enderecoBairro: this.encomendaForm.get('enderecoBairro')?.value,
      enderecoRua: this.encomendaForm.get('enderecoRua')?.value,
      enderecoNumero: this.encomendaForm.get('enderecoNumero')?.value,
      enderecoComplemento: this.encomendaForm.get('enderecoComplemento')?.value,
      valorAdiantamento: valorAdiantamento,
      itens: itensRequest
    };

    this.dialogRef.close(encomendaRequest);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
