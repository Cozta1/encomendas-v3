import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
// Importe MAT_DIALOG_DATA para receber os dados
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ClienteResponse } from '../../../core/models/cliente.interfaces'; // Ajuste o caminho se necessário

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
  templateUrl: './cliente-form-dialog.html',
  // styleUrl: './cliente-form-dialog.scss'
})
export class ClienteFormDialog {
  form: FormGroup;
  isEditMode: boolean; // Para sabermos se é "Editar" ou "Criar"

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ClienteFormDialog>,
    // Injeta os dados enviados pelo componente "Clientes"
    @Inject(MAT_DIALOG_DATA) public data: ClienteResponse | null
  ) {
    // Se 'data' não for nulo, estamos no modo de edição
    this.isEditMode = !!data;

    // Preenche o formulário com os dados recebidos (se houver)
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
      // Retorna os dados do formulário para o componente que chamou
      this.dialogRef.close(this.form.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close(); // Fecha sem retornar nada
  }
}
