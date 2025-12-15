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

// Serviços
import { ClienteService } from '../../../core/services/cliente.service';
import { ProdutoService } from '../../../core/services/produto.service';
import { FornecedorService } from '../../../core/services/fornecedor.service';
import { CepService, ViaCepResponse } from '../../../core/services/cep.service';

// Interfaces e DTOs
import { ClienteResponse } from '../../../core/models/cliente.interfaces';
import { ProdutoResponse } from '../../../core/models/produto.interfaces';
import { FornecedorResponse } from '../../../core/models/fornecedor.interfaces';
import { EncomendaItemRequest, EncomendaRequest } from '../../../core/models/encomenda.interfaces';

// Dialog de Cliente (Atalho)
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

  // Formulários
  encomendaForm: FormGroup;
  itemForm: FormGroup;

  // Lista de Itens
  itensDataSource = new FormArray<FormGroup>([]);
  displayedColumns: string[] = ['produto', 'fornecedor', 'quantidade', 'precoCotado', 'subtotal', 'acoes'];

  // Autocomplete Observables
  filteredClientes$!: Observable<ClienteResponse[]>;
  filteredProdutos$!: Observable<ProdutoResponse[]>;
  filteredFornecedores$!: Observable<FornecedorResponse[]>;

  // Cache de dados
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
    // Configuração do Formulário Principal
    this.encomendaForm = this.fb.group({
      cliente: [null, Validators.required],

      // Endereço (Multivalorado)
      enderecoCep: ['', [Validators.required, Validators.minLength(8)]],
      enderecoBairro: ['', Validators.required],
      enderecoRua: ['', Validators.required],
      enderecoNumero: ['', Validators.required],
      enderecoComplemento: [''],

      // Pagamento
      valorAdiantamento: [null, Validators.min(0)],

      observacoes: ['']
    });

    // Configuração do Formulário de Item
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

  // --- CARREGAMENTO DE DADOS ---
  private carregarDadosIniciais(): void {
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
  }

  // --- BUSCA DE CEP AUTOMÁTICA ---
  private setupCepListener(): void {
    this.encomendaForm.get('enderecoCep')?.valueChanges.pipe(
      debounceTime(300), // Aguarda usuário parar de digitar
      filter(value => value && value.replace(/\D/g, '').length === 8), // Valida tamanho (8 números)
      switchMap(cep => this.cepService.buscarCep(cep))
    ).subscribe((response: ViaCepResponse | null) => {
      if (response && !response.erro) {
        // Preenche campos automaticamente
        this.encomendaForm.patchValue({
          enderecoRua: response.logradouro,
          enderecoBairro: response.bairro,
          // enderecoComplemento: response.complemento // Opcional
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

  // --- FILTROS DE AUTOCOMPLETE ---
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

  // --- PREENCHIMENTO DE PREÇO ---
  private observeProdutoChanges(): void {
    this.itemForm.get('produto')?.valueChanges.pipe(
      filter(value => typeof value === 'object' && value !== null)
    ).subscribe((produto: ProdutoResponse) => {
      this.itemForm.get('precoCotado')?.setValue(produto.precoBase);
    });
  }

  // --- FORMATADORES DE DISPLAY ---
  displayClienteFn(cliente: ClienteResponse): string { return cliente && cliente.nome ? cliente.nome : ''; }
  displayProdutoFn(produto: ProdutoResponse): string { return produto && produto.nome ? produto.nome : ''; }
  displayFornecedorFn(fornecedor: FornecedorResponse): string { return fornecedor && fornecedor.nome ? fornecedor.nome : ''; }

  // --- CRIAR NOVO CLIENTE (ATALHO) ---
  abrirModalNovoCliente(event: MouseEvent): void {
    event.stopPropagation();
    const dialogRef = this.dialog.open(ClienteFormDialog, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: null
    });

    dialogRef.afterClosed().subscribe(novoClienteRequest => {
      if (novoClienteRequest) {
        this.clienteService.criarCliente(novoClienteRequest).subscribe(clienteCriado => {
          this.snackBar.open('Cliente criado e selecionado!', 'OK', { duration: 3000 });
          this.allClientes.push(clienteCriado);
          this.encomendaForm.get('cliente')?.setValue(clienteCriado);

          // Se o cliente criado tiver endereço, poderíamos preencher aqui (Opcional)
          if(clienteCriado.enderecos && clienteCriado.enderecos.length > 0) {
             const end = clienteCriado.enderecos[0]; // Pega o primeiro
             this.encomendaForm.patchValue({
                 enderecoCep: end.cep,
                 enderecoRua: end.rua,
                 enderecoBairro: end.bairro,
                 enderecoNumero: end.numero,
                 enderecoComplemento: end.complemento
             });
          }
        });
      }
    });
  }

  // --- GERENCIAMENTO DE ITENS ---
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

    // Reseta form de item
    this.itemForm.reset({
      produto: null,
      fornecedor: null,
      quantidade: 1,
      precoCotado: 0
    });
  }

  removerItem(index: number): void {
    this.itensDataSource.removeAt(index);
    if (this.itensTable) this.itensTable.renderRows();
  }

  getValorTotalEncomenda(): number {
    return this.itensDataSource.controls.reduce((acc, itemForm) => acc + (itemForm.get('subtotal')?.value || 0), 0);
  }

  // --- SALVAR E FECHAR ---
  onSave(): void {
    if (this.encomendaForm.invalid || this.itensDataSource.length === 0) {
      this.snackBar.open('Preencha os campos obrigatórios e adicione itens.', 'Fechar', { duration: 3000 });
      this.encomendaForm.markAllAsTouched();
      return;
    }

    const totalEncomenda = this.getValorTotalEncomenda();
    const valorAdiantamento = this.encomendaForm.get('valorAdiantamento')?.value || 0;

    // VALIDACAO DE ADIANTAMENTO
    if (valorAdiantamento > totalEncomenda) {
      this.snackBar.open(
        `O adiantamento (R$ ${valorAdiantamento}) não pode ser maior que o total (R$ ${totalEncomenda}).`,
        'Corrigir',
        { duration: 5000 }
      );
      return;
    }

    // Preparar objeto para envio
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
      // Endereço
      enderecoCep: this.encomendaForm.get('enderecoCep')?.value,
      enderecoBairro: this.encomendaForm.get('enderecoBairro')?.value,
      enderecoRua: this.encomendaForm.get('enderecoRua')?.value,
      enderecoNumero: this.encomendaForm.get('enderecoNumero')?.value,
      enderecoComplemento: this.encomendaForm.get('enderecoComplemento')?.value,
      // Valores
      valorAdiantamento: valorAdiantamento,
      itens: itensRequest
    };

    this.dialogRef.close(encomendaRequest);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
