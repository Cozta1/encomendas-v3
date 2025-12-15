import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, filter, switchMap } from 'rxjs/operators';

import { ClienteRequest, ClienteResponse } from '../../../core/models/cliente.interfaces';
import { CepService } from '../../../core/services/cep.service';

@Component({
  selector: 'app-cliente-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule
  ],
  templateUrl: './cliente-form-dialog.html',
  styleUrls: ['./cliente-form-dialog.scss']
})
export class ClienteFormDialog implements OnInit {
  form: FormGroup;
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ClienteFormDialog>,
    private cepService: CepService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: ClienteResponse | null
  ) {
    this.isEditMode = !!data;

    this.form = this.fb.group({
      nome: [data?.nome || '', Validators.required],
      cpf: [data?.cpf || ''], // Novo campo
      email: [data?.email || '', [Validators.required, Validators.email]],
      telefone: [data?.telefone || ''],
      enderecos: this.fb.array([])
    });

    if (this.isEditMode && data?.enderecos) {
      data.enderecos.forEach(end => this.adicionarEndereco(end));
    } else {
      this.adicionarEndereco();
    }
  }

  ngOnInit(): void {}

  get enderecosFormArray(): FormArray {
    return this.form.get('enderecos') as FormArray;
  }

  novoEnderecoGroup(dados: any = {}): FormGroup {
    const group = this.fb.group({
      cep: [dados.cep || '', [Validators.required, Validators.minLength(8)]],
      rua: [dados.rua || '', Validators.required],
      numero: [dados.numero || '', Validators.required],
      bairro: [dados.bairro || '', Validators.required],
      complemento: [dados.complemento || ''],
      cidade: [dados.cidade || ''],
      uf: [dados.uf || '']
    });

    this.setupCepListener(group);
    return group;
  }

  adicionarEndereco(dados: any = {}): void {
    this.enderecosFormArray.push(this.novoEnderecoGroup(dados));
  }

  removerEndereco(index: number): void {
    this.enderecosFormArray.removeAt(index);
  }

  setupCepListener(group: FormGroup): void {
    group.get('cep')?.valueChanges.pipe(
      debounceTime(300),
      filter(value => value && value.replace(/\D/g, '').length === 8),
      switchMap(cep => this.cepService.buscarCep(cep))
    ).subscribe(response => {
      if (response && !response.erro) {
        group.patchValue({
          rua: response.logradouro,
          bairro: response.bairro,
          cidade: response.localidade,
          uf: response.uf
        });
        this.snackBar.open(`Endereço encontrado: ${response.localidade}`, 'OK', { duration: 2000 });
      } else if (response && response.erro) {
        this.snackBar.open('CEP não encontrado.', 'Fechar', { duration: 3000 });
      }
    });
  }

  onSave(): void {
    if (this.form.valid) {
      const formValue = this.form.value;
      const clienteRequest: ClienteRequest = {
        nome: formValue.nome,
        cpf: formValue.cpf, // Envia CPF
        email: formValue.email,
        telefone: formValue.telefone,
        enderecos: formValue.enderecos
      };
      this.dialogRef.close(clienteRequest);
    } else {
        this.form.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
