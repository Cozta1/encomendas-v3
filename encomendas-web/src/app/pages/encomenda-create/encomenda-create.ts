import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin, Observable, Subject } from 'rxjs';
import { startWith, map, filter, takeUntil, debounceTime } from 'rxjs/operators';

// Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';

// Services e Models
import { EncomendaService } from '../../core/services/encomenda.service';
import { CepService } from '../../core/services/cep.service';
import { ProdutoService } from '../../core/services/produto.service';
import { FornecedorService } from '../../core/services/fornecedor.service';
import { ProdutoResponse } from '../../core/models/produto.interfaces';
import { FornecedorResponse } from '../../core/models/fornecedor.interfaces';

// Diretivas (Removido DateMaskDirective)
import { CepMaskDirective } from '../../core/directives/cep-mask.directive';
import { CpfMaskDirective } from '../../core/directives/cpf-mask.directive';
import { PhoneMaskDirective } from '../../core/directives/phone-mask.directive';

@Component({
  selector: 'app-encomenda-create',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, RouterModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatDatepickerModule, MatNativeDateModule,
    MatCheckboxModule, MatDividerModule, MatAutocompleteModule, MatTooltipModule,
    MatSnackBarModule,
    CepMaskDirective, CpfMaskDirective, PhoneMaskDirective
  ],
  templateUrl: './encomenda-create.html',
  styleUrls: ['./encomenda-create.scss']
})
export class EncomendaCreate implements OnInit, OnDestroy {
  form: FormGroup;
  itemForm: FormGroup;
  private destroy$ = new Subject<void>();
  private readonly DRAFT_KEY = 'enc_draft_nova_encomenda';
  temRascunho = false;

  filteredProdutos$!: Observable<ProdutoResponse[]>;
  filteredFornecedores$!: Observable<FornecedorResponse[]>;

  allProdutos: ProdutoResponse[] = [];
  allFornecedores: FornecedorResponse[] = [];

  constructor(
    private fb: FormBuilder,
    private encomendaService: EncomendaService,
    private cepService: CepService,
    private produtoService: ProdutoService,
    private fornecedorService: FornecedorService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    // Formulário Principal
    this.form = this.fb.group({
      cliente: this.fb.group({
        nome: ['', Validators.required],
        codigoInterno: [''],
        cpf: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        telefone: ['', Validators.required]
      }),
      enderecoCep: ['', [Validators.required, Validators.minLength(8)]],
      enderecoBairro: ['', Validators.required],
      enderecoRua: ['', Validators.required],
      enderecoNumero: ['', Validators.required],
      enderecoComplemento: [''],
      dataEstimadaEntrega: [null, Validators.required], // Valor será um objeto Date direto do Datepicker
      horaEstimadaEntrega: [''],
      observacoes: [''],
      notaFutura: [false],
      vendaEstoqueNegativo: [false],
      apenasEncomenda: [false],
      itens: this.fb.array([], Validators.required),
      valorTotal: [{ value: 0, disabled: true }],
      quitado: [false],
      valorAdiantamento: [0]
    });

    // Formulário Auxiliar para adicionar itens
    this.itemForm = this.fb.group({
      produto: [null, Validators.required],
      fornecedor: [null, Validators.required],
      quantidade: [1, [Validators.required, Validators.min(1)]],
      precoCotado: [0, Validators.required]
    });
  }

  ngOnInit(): void {
    this.carregarDadosAuxiliares();
    this.carregarRascunho();
    this.setupListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  carregarDadosAuxiliares() {
    forkJoin({
      produtos: this.produtoService.getProdutos(),
      fornecedores: this.fornecedorService.getFornecedores()
    }).subscribe(({ produtos, fornecedores }) => {
      this.allProdutos = produtos;
      this.filteredProdutos$ = this.itemForm.get('produto')!.valueChanges.pipe(
        startWith(''),
        map(value => {
          const nome = typeof value === 'string' ? value : value?.nome;
          return nome ? this._filterProdutos(nome as string) : this.allProdutos.slice();
        })
      );

      this.allFornecedores = fornecedores;
      this.filteredFornecedores$ = this.itemForm.get('fornecedor')!.valueChanges.pipe(
        startWith(''),
        map(value => {
          const nome = typeof value === 'string' ? value : value?.nome;
          return nome ? this._filterFornecedores(nome as string) : this.allFornecedores.slice();
        })
      );
    });
  }

  setupListeners() {
    // Preencher preço ao selecionar produto
    this.itemForm.get('produto')?.valueChanges.pipe(
      takeUntil(this.destroy$),
      filter(value => typeof value === 'object' && value !== null)
    ).subscribe((produto: ProdutoResponse) => {
      this.itemForm.get('precoCotado')?.setValue(produto.precoBase);
    });

    // Lógica do Quitado
    this.form.get('quitado')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(isQuitado => {
      const adiantamentoControl = this.form.get('valorAdiantamento');
      if (isQuitado) {
        adiantamentoControl?.setValue(this.calcularTotalItens());
        adiantamentoControl?.disable();
      } else {
        adiantamentoControl?.enable();
        adiantamentoControl?.setValue(0);
      }
    });

    // Auto-save rascunho
    this.form.valueChanges.pipe(
      debounceTime(800),
      takeUntil(this.destroy$)
    ).subscribe(() => this.salvarRascunho());
  }

  // --- RASCUNHO ---

  private carregarRascunho(): void {
    const saved = localStorage.getItem(this.DRAFT_KEY);
    if (!saved) return;
    try {
      const draft = JSON.parse(saved);

      this.form.patchValue({
        cliente: draft.cliente ?? {},
        enderecoCep: draft.enderecoCep ?? '',
        enderecoBairro: draft.enderecoBairro ?? '',
        enderecoRua: draft.enderecoRua ?? '',
        enderecoNumero: draft.enderecoNumero ?? '',
        enderecoComplemento: draft.enderecoComplemento ?? '',
        dataEstimadaEntrega: draft.dataEstimadaEntrega ? new Date(draft.dataEstimadaEntrega) : null,
        horaEstimadaEntrega: draft.horaEstimadaEntrega ?? '',
        observacoes: draft.observacoes ?? '',
        notaFutura: draft.notaFutura ?? false,
        vendaEstoqueNegativo: draft.vendaEstoqueNegativo ?? false,
        apenasEncomenda: draft.apenasEncomenda ?? false,
        quitado: draft.quitado ?? false,
        valorAdiantamento: draft.valorAdiantamento ?? 0
      });

      if (Array.isArray(draft.itens) && draft.itens.length > 0) {
        draft.itens.forEach((item: any) => {
          this.itensFormArray.push(this.fb.group({
            produto: [item.produtoNome ?? ''],
            fornecedor: [item.fornecedorNome ?? ''],
            produtoNome: [item.produtoNome ?? ''],
            fornecedorNome: [item.fornecedorNome ?? ''],
            quantidade: [item.quantidade ?? 1],
            precoCotado: [item.precoCotado ?? 0]
          }));
        });
        this.atualizarTotais();
      }

      this.temRascunho = true;
      this.snackBar.open('Rascunho recuperado!', 'Descartar', { duration: 6000 })
        .onAction().subscribe(() => this.limparRascunho());
    } catch {
      localStorage.removeItem(this.DRAFT_KEY);
    }
  }

  private salvarRascunho(): void {
    const raw = this.form.getRawValue();
    const draft = {
      ...raw,
      dataEstimadaEntrega: raw.dataEstimadaEntrega instanceof Date
        ? raw.dataEstimadaEntrega.toISOString()
        : raw.dataEstimadaEntrega,
      itens: raw.itens.map((item: any) => ({
        produtoNome: item.produtoNome ?? '',
        fornecedorNome: item.fornecedorNome ?? '',
        quantidade: item.quantidade,
        precoCotado: item.precoCotado
      }))
    };
    localStorage.setItem(this.DRAFT_KEY, JSON.stringify(draft));
  }

  limparRascunho(): void {
    localStorage.removeItem(this.DRAFT_KEY);
    this.temRascunho = false;
  }

  // --- MÉTODOS DE FILTRO ---
  private _filterProdutos(value: string): ProdutoResponse[] {
    const filterValue = value.toLowerCase();
    return this.allProdutos.filter(option => option.nome.toLowerCase().includes(filterValue));
  }

  private _filterFornecedores(value: string): FornecedorResponse[] {
    const filterValue = value.toLowerCase();
    return this.allFornecedores.filter(option => option.nome.toLowerCase().includes(filterValue));
  }

  displayProdutoFn(produto: ProdutoResponse): string {
    return produto && produto.nome ? produto.nome : '';
  }

  displayFornecedorFn(fornecedor: FornecedorResponse): string {
    return fornecedor && fornecedor.nome ? fornecedor.nome : '';
  }

  // --- CEP ---
  buscarCep() {
    const rawCep = this.form.get('enderecoCep')?.value?.replace(/\D/g, '') || '';
    if (rawCep.length === 8) {
      this.cepService.buscarCep(rawCep).subscribe(dados => {
        if (dados && !dados.erro) {
          this.form.patchValue({
            enderecoRua: dados.logradouro,
            enderecoBairro: dados.bairro,
          });
          this.snackBar.open('Endereço encontrado!', 'OK', { duration: 2000 });
        }
      });
    }
  }

  // --- GESTÃO DE ITENS ---
  get itensFormArray() {
    return this.form.get('itens') as FormArray;
  }

  adicionarItem() {
    if (this.itemForm.invalid) return;

    const produtoVal = this.itemForm.get('produto')?.value;
    const fornecedorVal = this.itemForm.get('fornecedor')?.value;
    const quantidade = this.itemForm.get('quantidade')?.value;
    const precoCotado = this.itemForm.get('precoCotado')?.value;

    // Extrai o nome independente de ser objeto (selecionado do autocomplete) ou string (digitado)
    const produtoNome: string = typeof produtoVal === 'object' ? (produtoVal?.nome ?? '') : (produtoVal ?? '');
    const fornecedorNome: string = typeof fornecedorVal === 'object' ? (fornecedorVal?.nome ?? '') : (fornecedorVal ?? '');

    const itemGroup = this.fb.group({
      produto: [produtoVal],
      fornecedor: [fornecedorVal],
      produtoNome: [produtoNome],
      fornecedorNome: [fornecedorNome],
      quantidade: [quantidade],
      precoCotado: [precoCotado]
    });

    this.itensFormArray.push(itemGroup);
    this.atualizarTotais();

    this.itemForm.reset({
      produto: null,
      fornecedor: null,
      quantidade: 1,
      precoCotado: 0
    });
  }

  removerItem(index: number) {
    this.itensFormArray.removeAt(index);
    this.atualizarTotais();
  }

  atualizarTotais() {
    const total = this.calcularTotalItens();
    this.form.get('valorTotal')?.setValue(total);
    if (this.form.get('quitado')?.value) {
      this.form.get('valorAdiantamento')?.setValue(total);
    }
  }

  calcularTotalItens(): number {
    return this.itensFormArray.controls.reduce((acc, control) => {
      const qtd = control.get('quantidade')?.value || 0;
      const preco = control.get('precoCotado')?.value || 0;
      return acc + (qtd * preco);
    }, 0);
  }

  // --- SUBMIT ---
  private limparFormatacao(valor: string): string {
    return valor ? valor.replace(/\D/g, '') : '';
  }

  salvar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Verifique os campos obrigatórios.', 'Fechar', { duration: 3000 });
      return;
    }

    const formVal = this.form.getRawValue();

    // Normalizar cliente
    formVal.cliente.cpf = this.limparFormatacao(formVal.cliente.cpf);
    formVal.cliente.telefone = this.limparFormatacao(formVal.cliente.telefone);
    formVal.enderecoCep = this.limparFormatacao(formVal.enderecoCep);

    // Processar Data
    let dataFinal = null;

    // O Datepicker do Angular já retorna um objeto Date, não precisa de parse manual
    const dataObj = formVal.dataEstimadaEntrega;

    if (dataObj && dataObj instanceof Date) {
      if (formVal.horaEstimadaEntrega) {
        const [horas, minutos] = formVal.horaEstimadaEntrega.split(':');
        dataObj.setHours(+horas);
        dataObj.setMinutes(+minutos);
      }
      dataFinal = dataObj.toISOString();
    } else {
        this.snackBar.open('Data inválida.', 'Corrigir', { duration: 3000 });
        return;
    }

    // Preparar Itens para o DTO
    const itensDTO = formVal.itens.map((item: any) => ({
      produto: { nome: item.produto.nome || item.produto, codigo: item.produto.codigo },
      fornecedor: { nome: item.fornecedor.nome || item.fornecedor },
      quantidade: item.quantidade,
      precoCotado: item.precoCotado
    }));

    const payload = {
      ...formVal,
      itens: itensDTO,
      dataEstimadaEntrega: dataFinal
    };

    this.encomendaService.criarEncomenda(payload).subscribe({
      next: () => {
        this.limparRascunho();
        this.snackBar.open('Encomenda criada com sucesso!', 'OK', { duration: 3000 });
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.snackBar.open('Erro ao criar encomenda.', 'Fechar', { duration: 5000 });
      }
    });
  }
}
