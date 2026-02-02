import { Component, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-equipe-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatButtonModule
  ],
  templateUrl: './equipe-form-dialog.html'
})
export class EquipeFormDialog {
  form: FormGroup;
  isEdicao = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EquipeFormDialog>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.isEdicao = !!data;

    this.form = this.fb.group({
      nome: [data?.nome || '', Validators.required],
      descricao: [data?.descricao || '']
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
