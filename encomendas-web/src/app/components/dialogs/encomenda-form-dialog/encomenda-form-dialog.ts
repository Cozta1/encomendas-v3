import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Observable, of } from 'rxjs';
import { startWith, switchMap, debounceTime, catchError } from 'rxjs/operators';

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
    MatTableModule, MatSnackBarModule
  ],
  templateUrl: './encomenda-form-dialog.html',
  styleUrl: './encomenda-form-dialog.scss'
})
export class EncomendaFormDialog implements OnInit {

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

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EncomendaFormDialog>,
    private dialog: MatDialog, // Para abrir o modal de criar cliente
    private snackBar: MatSnackBar,
    private clienteService: ClienteService,
    private produtoService: ProdutoService,
    private fornecedorService: FornecedorService
  ) {
    // Formulário principal da encomenda
    this.encomendaForm = this.fb.group({
      cliente: [null, Validators.required], // Armazena o *objeto* Cliente
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
    this.setupAutocompletes();
  }

  // Configura os autocompletes para pesquisar
  setupAutocompletes(): void {
    // Autocomplete de Cliente
    this.filteredClientes$ = this.encomendaForm.get('cliente')!.valueChanges.pipe(
      startWith(''),
      debounceTime(300), // Espera 300ms após o usuário parar de digitar
      switchMap(value => {
        const nome = typeof value === 'string' ? value : value?.nome || '';
        if (nome.length < 2) return of([]); // Só pesquisa com 2+ letras
        return this.clienteService.searchClientes(nome).pipe(
          catchError(() => of([])) // Em caso de erro, retorna lista vazia
        );
      })
    );

    // Autocomplete de Produto
    this.filteredProdutos$ = this.itemForm.get('produto')!.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap(value => {
        const nome = typeof value === 'string' ? value : value?.nome || '';
        if (nome.length < 2) return of([]);
        return this.produtoService.searchProdutos(nome).pipe(
          catchError(() => of([]))
        );
      })
    );

    // Autocomplete de Fornecedor
    this.filteredFornecedores$ = this.itemForm.get('fornecedor')!.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap(value => {
        const nome = typeof value === 'string' ? value : value?.nome || '';
        if (nome.length < 2) return of([]);
        return this.fornecedorService.searchFornecedores(nome).pipe(
          catchError(() => of([]))
        );
      })
    );
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

  // --- SEU REQUISITO: Abrir modal de novo cliente ---
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
          // Preenche o campo de autocomplete com o novo cliente
          this.encomendaForm.get('cliente')?.setValue(clienteCriado);
        });
      }
    });
  }

  // Adiciona o item do itemForm para a tabela (FormArray)
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

    // Reseta o formulário de adicionar item
    this.itemForm.reset({
      produto: null,
      fornecedor: null,
      quantidade: 1,
      precoCotado: 0
    });
  }

  // Remove um item da tabela (FormArray)
  removerItem(index: number): void {
    this.itensDataSource.removeAt(index);
  }

  // Função helper para recalcular o total (pode ser chamada no adicionar/remover)
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
