import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FornecedorRequest } from '../../../core/models/fornecedor.interfaces'; // Ajuste se necessário

@Component({
  selector: 'app-fornecedor-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './fornecedor-form-dialog.html', // Usando nome simplificado
  styleUrls: ['./fornecedor-form-dialog.scss']
})
export class FornecedorFormDialog implements OnInit { // Nome da classe simplificado

  public form: FormGroup;
  public isEditMode: boolean = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<FornecedorFormDialog>,
    @Inject(MAT_DIALOG_DATA) public data: FornecedorRequest | null
  ) {
    // Inicializa o formulário
    this.form = this.fb.group({
      nome: ['', Validators.required],
      cnpj: [''],
      contatoNome: [''],
      telefone: [''],
      email: ['', Validators.email],
      endereco: ['']
    });
  }

  ngOnInit(): void {
    // Se recebemos dados (modo de edição), preenche o formulário
    if (this.data) {
      this.isEditMode = true;
      this.form.patchValue(this.data);
    }
  }

  /**
   * Chamado ao clicar em Salvar.
   * Se o formulário for válido, fecha o diálogo e retorna os dados do formulário.
   */
  onSave(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    } else {
      this.form.markAllAsTouched();
    }
  }

  /**
   * Chamado ao clicar em Cancelar.
   * Fecha o diálogo sem retornar dados.
   */
  onCancel(): void {
    this.dialogRef.close();
  }
}
