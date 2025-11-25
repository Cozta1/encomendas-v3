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
  selector: 'app-forgot-password',
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
  templateUrl: './forgot-password.html',
  styleUrls: ['../login.scss'] // Reutiliza estilo
})
export class ForgotPassword {
  step = 1;
  emailForm: FormGroup;
  resetForm: FormGroup;
  isLoading = false;
  emailEnviado = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.resetForm = this.fb.group({
      token: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  enviarCodigo() {
    if (this.emailForm.invalid) return;
    this.isLoading = true;
    const email = this.emailForm.get('email')?.value;

    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.isLoading = false;
        this.emailEnviado = email;
        this.step = 2;
        this.snackBar.open('Código enviado! Verifique seu email.', 'OK', { duration: 5000 });
      },
      error: (err: any) => {
        this.isLoading = false;
        this.snackBar.open('Erro ao enviar código. Verifique o email.', 'Fechar', { duration: 5000 });
      }
    });
  }

  resetarSenha() {
    if (this.resetForm.invalid) return;
    this.isLoading = true;

    const payload = {
      email: this.emailEnviado,
      token: this.resetForm.get('token')?.value,
      newPassword: this.resetForm.get('newPassword')?.value
    };

    this.authService.resetPassword(payload).subscribe({
      next: () => {
        this.snackBar.open('Senha alterada com sucesso!', 'OK', { duration: 3000 });
        this.router.navigate(['/login']);
      },
      error: (err: any) => {
        this.isLoading = false;
        const msg = typeof err.error === 'string' ? err.error : 'Erro ao alterar senha.';
        this.snackBar.open(msg, 'Fechar', { duration: 5000 });
      }
    });
  }
}
