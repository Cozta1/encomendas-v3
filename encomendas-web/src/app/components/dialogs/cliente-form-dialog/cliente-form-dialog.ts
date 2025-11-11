import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
// Ajuste o caminho se o seu 'cliente.interfaces.ts' estiver em outro lugar
import { ClienteResponse } from '../../../core/models/cliente.interfaces';

@Component({
  selector: 'app-cliente-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  // --- CORREÇÃO AQUI ---
  templateUrl: './cliente-form-dialog.html',
  // styleUrl: './cliente-form-dialog.scss' // Verifique se você tem um arquivo .scss
})
export class ClienteFormDialog {
  form: FormGroup;
  isEditMode: boolean;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ClienteFormDialog>,
    @Inject(MAT_DIALOG_DATA) public data: ClienteResponse | null
  ) {
    this.isEditMode = !!data; // Se 'data' existir, estamos editando

    this.form = this.fb.group({
      nome: [data?.nome || '', Validators.required],
      email: [data?.email || '', Validators.email],
      telefone: [data?.telefone || ''],
      cpfCnpj: [data?.cpfCnpj || ''],
      endereco: [data?.endereco || '']
    });
  }

  onSave(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
