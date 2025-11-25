import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule
  ],
  templateUrl: './register.html',
  styleUrls: ['../login.scss'] // Reutiliza o estilo do login
})
export class Register {
  form: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      nomeCompleto: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      identificacao: ['', Validators.required],
      telefone: [''],
      password: ['', Validators.required],
      registrationKey: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.isLoading = true;

    this.authService.register(this.form.value).subscribe({
      next: () => {
        this.snackBar.open('Cadastro realizado! Faça login.', 'OK', { duration: 3000 });
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isLoading = false;
        const msg = typeof err.error === 'string' ? err.error : 'Erro ao cadastrar.';
        this.snackBar.open(msg, 'Fechar', { duration: 5000 });
      }
    });
  }
}
