import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ProdutoRequest } from '../../../core/models/produto.interfaces';

@Component({
  selector: 'app-produto-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './produto-form-dialog.html',
  styleUrls: ['./produto-form-dialog.scss']
})
export class ProdutoFormDialog implements OnInit {

  public form: FormGroup;
  public isEditMode: boolean = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ProdutoFormDialog>,
    @Inject(MAT_DIALOG_DATA) public data: ProdutoRequest | null
  ) {
    // Inicializa o formulário
    this.form = this.fb.group({
      nome: ['', Validators.required],
      codigo: [''],
      descricao: [''],
      preco: [0, [Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    // Se recebemos dados (modo de edição), preenche o formulário
    if (this.data) {
      this.isEditMode = true;
      this.form.patchValue(this.data);
    }
  }

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
