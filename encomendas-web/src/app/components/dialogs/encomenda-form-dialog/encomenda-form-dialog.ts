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

// Serviços
import { ClienteService } from '../../../core/services/cliente.service';
import { ProdutoService } from '../../../core/services/produto.service';

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

  // Observables para carregar dados nos selects
  public clientes$!: Observable<ClienteResponse[]>;
  public produtos$!: Observable<ProdutoResponse[]>;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EncomendaFormDialog>,
    @Inject(MAT_DIALOG_DATA) public data: EncomendaRequest | null,
    private clienteService: ClienteService,
    private produtoService: ProdutoService
  ) {
    this.form = this.fb.group({
      clienteId: ['', Validators.required],
      observacoes: [''],
      itens: this.fb.array([], Validators.required) // Começa com array de itens vazio
    });
  }

  ngOnInit(): void {
    this.carregarDadosSelect();

    if (this.data) {
      this.isEditMode = true;
      // Lógica para preencher o formulário em modo de edição (mais complexa, deixada para depois)
      // this.form.patchValue(this.data);
    }
  }

  // Carrega clientes e produtos para os selects
  carregarDadosSelect(): void {
    this.clientes$ = this.clienteService.getClientes();
    this.produtos$ = this.produtoService.getProdutos();
  }

  // --- Métodos para gerir o FormArray 'itens' ---

  get itens(): FormArray {
    return this.form.get('itens') as FormArray;
  }

  novoItem(): FormGroup {
    return this.fb.group({
      produtoId: ['', Validators.required],
      quantidade: [1, [Validators.required, Validators.min(1)]]
      // precoUnitario: [0] // O backend irá calcular
    });
  }

  adicionarItem(): void {
    this.itens.push(this.novoItem());
  }

  removerItem(index: number): void {
    this.itens.removeAt(index);
  }

  // --- Fim dos métodos do FormArray ---

  onSave(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    } else {
      this.form.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
