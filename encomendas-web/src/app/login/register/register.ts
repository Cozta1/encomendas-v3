import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '../../core/auth/auth.service';
import { CpfMaskDirective } from '../../core/directives/cpf-mask.directive';
import { PhoneMaskDirective } from '../../core/directives/phone-mask.directive';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    RouterModule,
    MatSnackBarModule,
    CpfMaskDirective,
    PhoneMaskDirective
  ],
  templateUrl: './register.html',
  styleUrls: ['./register.scss']
})
export class Register {
  registerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.registerForm = this.fb.group({
      nomeCompleto: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],

      // AGORA OBRIGATÓRIO
      identificacao: ['', Validators.required],

      telefone: ['', Validators.required],
      registrationKey: ['', Validators.required],
      cargo: ['']
    });
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.authService.register(this.registerForm.value).subscribe({
        next: () => {
          this.snackBar.open('Registro realizado com sucesso!', 'OK', { duration: 3000 });
          this.router.navigate(['/login']);
        },
        error: (err) => {
          console.error(err);
          this.snackBar.open('Erro ao registrar. Verifique os dados.', 'Fechar', { duration: 3000 });
        }
      });
    } else {
      this.registerForm.markAllAsTouched();
    }
  }
}
