import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';

import { UsuarioService } from '../../core/services/usuario.service';
import { UsuarioResponse } from '../../core/models/usuario.interfaces';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatCardModule, MatButtonModule, MatInputModule, MatIconModule,
    MatFormFieldModule, MatDividerModule, MatSnackBarModule
  ],
  templateUrl: './perfil.html',
  styleUrls: ['./perfil.scss']
})
export class PerfilPage implements OnInit {

  form: FormGroup;
  loading = false;
  usuario$ = new BehaviorSubject<UsuarioResponse | null>(null);

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.form = this.fb.group({
      nomeCompleto: ['', [Validators.required, Validators.minLength(3)]],
      telefone: [''],
      cargo: [''],
      password: ['', [Validators.minLength(6)]] // Senha é opcional, mas se tiver, min 6 chars
    });
  }

  ngOnInit(): void {
    this.carregarPerfil();
  }

  carregarPerfil() {
    this.loading = true;
    this.usuarioService.getMeuPerfil().subscribe({
      next: (dados) => {
        this.usuario$.next(dados);
        this.form.patchValue({
          nomeCompleto: dados.nomeCompleto,
          telefone: dados.telefone,
          cargo: dados.cargo
        });
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open('Erro ao carregar perfil.', 'Fechar', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  salvar() {
    if (this.form.invalid) return;

    this.loading = true;
    const payload = this.form.value;

    // Remove senha se estiver vazia para não enviar string vazia
    if (!payload.password) {
      delete payload.password;
    }

    this.usuarioService.atualizarPerfil(payload).subscribe({
      next: (dadosAtualizados) => {
        this.usuario$.next(dadosAtualizados);
        this.snackBar.open('Perfil atualizado com sucesso!', 'OK', { duration: 3000 });
        this.form.get('password')?.reset(); // Limpa campo de senha
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open('Erro ao atualizar perfil.', 'Fechar', { duration: 3000 });
        this.loading = false;
      }
    });
  }
}
