import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ClienteRequest } from '../../../core/models/cliente.interfaces'; // Ajuste o caminho se necessário

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
  templateUrl: './cliente-form-dialog.component.html',
  styleUrls: ['./cliente-form-dialog.component.scss'] // Adicionado para consistência
})
export class ClienteFormDialogComponent implements OnInit {

  public form: FormGroup;
  public isEditMode: boolean = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ClienteFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ClienteRequest | null // data será o Cliente para editar, ou null para criar
  ) {
    // Inicializa o formulário
    this.form = this.fb.group({
      nome: ['', Validators.required],
      email: ['', Validators.email],
      telefone: [''],
      cpfCnpj: [''],
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
      // Marca todos os campos como tocados para exibir erros, se houver
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
