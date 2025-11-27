import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-invite-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Convidar Membro</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" style="width: 100%;">
          <mat-label>Email do Usuário</mat-label>
          <input matInput formControlName="email" placeholder="usuario@email.com">
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-flat-button color="primary" (click)="onSend()" [disabled]="form.invalid">Enviar</button>
    </mat-dialog-actions>
  `
})
export class InviteDialog {
  form: FormGroup;
  constructor(private fb: FormBuilder, public dialogRef: MatDialogRef<InviteDialog>) {
    this.form = this.fb.group({ email: ['', [Validators.required, Validators.email]] });
  }
  onSend() { if (this.form.valid) this.dialogRef.close(this.form.value.email); }
  onCancel() { this.dialogRef.close(); }
}
