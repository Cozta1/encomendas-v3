import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';

// Interfaces
import { EncomendaRequest } from '../../../core/models/encomenda.interfaces';
import { ClienteResponse } from '../../../core/models/cliente.interfaces';
import { ProdutoResponse } from '../../../core/models/produto.interfaces';
import { FornecedorResponse } from '../../../core/models/fornecedor.interfaces'; // 1. Importar

// Serviços
import { ClienteService } from '../../../core/services/cliente.service';
import { ProdutoService } from '../../../core/services/produto.service';
import { FornecedorService } from '../../../core/services/fornecedor.service'; // 2. Importar

@Component({
  selector: 'app-encomenda-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatIconModule
  ],
  templateUrl: './encomenda-form-dialog.html',
  styleUrls: ['./encomenda-form-dialog.scss']
})
export class EncomendaFormDialog implements OnInit {

  public form: FormGroup;
  public isEditMode: boolean = false;

  // Observables para carregar dados
  public clientes$!: Observable<ClienteResponse[]>;
  public produtos$!: Observable<ProdutoResponse[]>;
  public fornecedores$!: Observable<FornecedorResponse[]>; // 3. Adicionar

  // Armazena a lista de produtos para auto-preenchimento
  private produtosList: ProdutoResponse[] = [];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EncomendaFormDialog>,
    @Inject(MAT_DIALOG_DATA) public data: EncomendaRequest | null,
    private clienteService: ClienteService,
    private produtoService: ProdutoService,
    private fornecedorService: FornecedorService // 4. Injetar
  ) {
    this.form = this.fb.group({
      clienteId: ['', Validators.required],
      observacoes: [''],
      itens: this.fb.array([], Validators.required)
    });
  }

  ngOnInit(): void {
    this.carregarDadosSelect();
  }

  carregarDadosSelect(): void {
    this.clientes$ = this.clienteService.getClientes();
    this.fornecedores$ = this.fornecedorService.getFornecedores(); // 5. Carregar fornecedores

    // 6. Carregar produtos e guardar a lista para consulta
    this.produtos$ = this.produtoService.getProdutos();
    this.produtos$.subscribe(produtos => {
      this.produtosList = produtos;
    });
  }

  // --- Métodos para gerir o FormArray 'itens' ---

  get itens(): FormArray {
    return this.form.get('itens') as FormArray;
  }

  // 7. Atualizar a criação do item
  novoItem(): FormGroup {
    return this.fb.group({
      produtoId: ['', Validators.required],
      fornecedorId: ['', Validators.required],
      precoCotado: [null, [Validators.required, Validators.min(0.01)]], // Começa nulo
      quantidade: [1, [Validators.required, Validators.min(1)]]
    });
  }

  adicionarItem(): void {
    this.itens.push(this.novoItem());
  }

  removerItem(index: number): void {
    this.itens.removeAt(index);
  }

  // 8. NOVO MÉTODO: Auto-preenche o preço cotado
  onProdutoSelecionado(produtoId: string, itemIndex: number): void {
    const produto = this.produtosList.find(p => p.id === produtoId);
    if (produto) {
      // Pega o 'FormGroup' do item específico
      const itemFormGroup = this.itens.at(itemIndex);
      // Define o 'precoCotado' como o 'precoBase' do produto
      itemFormGroup.get('precoCotado')?.setValue(produto.precoBase);
    }
  }

  // --- Fim dos métodos do FormArray ---

  onSave(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    } else {
      // Marca todos os campos como "tocados" para exibir os erros
      this.form.markAllAsTouched();
      this.itens.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
