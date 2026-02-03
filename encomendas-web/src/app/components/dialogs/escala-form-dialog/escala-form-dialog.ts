import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';

// Imports de Data
import { MatNativeDateModule, MAT_DATE_LOCALE, DateAdapter } from '@angular/material/core';
import { CustomDateAdapter } from '../../../core/adapters/custom-date-adapter'; //

// Diretiva de Máscara
import { DateMaskDirective } from '../../../core/directives/date-mask.directive';

@Component({
  selector: 'app-escala-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatDatepickerModule, MatNativeDateModule,
    MatCheckboxModule, MatExpansionModule,
    DateMaskDirective
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' },
    // Esta linha conecta seu CustomDateAdapter ao calendário deste componente
    { provide: DateAdapter, useClass: CustomDateAdapter }
  ],
  templateUrl: './escala-form-dialog.html',
  styleUrls: ['./escala-form-dialog.scss']
})
export class EscalaFormDialog {
  form: FormGroup;
  tipos = ['TRABALHO', 'FOLGA', 'FERIAS', 'ATESTADO'];

  diasOpcoes = [
    { label: 'Seg', value: 1 },
    { label: 'Ter', value: 2 },
    { label: 'Qua', value: 3 },
    { label: 'Qui', value: 4 },
    { label: 'Sex', value: 5 },
    { label: 'Sáb', value: 6 },
    { label: 'Dom', value: 7 }
  ];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EscalaFormDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.form = this.fb.group({
      data: [{ value: data.data, disabled: true }],
      tipo: [data.escala?.tipo || 'TRABALHO', Validators.required],
      horarioInicio: [data.escala?.horarioInicio || '08:00'],
      horarioFim: [data.escala?.horarioFim || '18:00'],
      observacao: [data.escala?.observacao || ''],

      replicar: [false],
      // O valor inicial deve ser um Date válido para o Adapter funcionar bem
      dataFimReplicacao: [this.getDataFimMes(data.data)],
      diasSelecionados: this.fb.array([])
    });

    this.selecionarDiaDaSemanaAtual(data.data);
  }

  getDataFimMes(dataRef: Date): Date {
    return new Date(dataRef.getFullYear(), dataRef.getMonth() + 1, 0);
  }

  diasMarcados: number[] = [];

  selecionarDiaDaSemanaAtual(data: Date) {
    let diaIso = data.getDay();
    if (diaIso === 0) diaIso = 7;
    this.diasMarcados.push(diaIso);
  }

  toggleDia(valor: number) {
    const index = this.diasMarcados.indexOf(valor);
    if (index >= 0) {
      this.diasMarcados.splice(index, 1);
    } else {
      this.diasMarcados.push(valor);
    }
  }

  isDiaMarcado(valor: number): boolean {
    return this.diasMarcados.includes(valor);
  }

  salvar() {
    if (this.form.valid) {
      const formValue = this.form.getRawValue();

      const result = {
        single: {
          ...formValue,
          data: this.data.data
        },
        replicacao: null as any
      };

      if (formValue.replicar) {
        // Com o CustomDateAdapter, o formControl 'dataFimReplicacao'
        // já deve ter um objeto Date válido se o usuário digitou corretamente.
        // Se ainda for string, o parseData garante.
        const dataFim = this.parseData(formValue.dataFimReplicacao);

        result.replicacao = {
          dataInicio: this.data.data,
          dataFim: dataFim,
          diasSemana: this.diasMarcados,
          horarioInicio: formValue.horarioInicio,
          horarioFim: formValue.horarioFim,
          tipo: formValue.tipo,
          observacao: formValue.observacao
        };
      }

      this.dialogRef.close(result);
    }
  }

  private parseData(valor: any): Date {
    if (!valor) return new Date();
    if (valor instanceof Date) return valor;

    // Tratamento extra caso o Adapter falhe em algum edge case
    if (typeof valor === 'string' && valor.includes('/')) {
      const partes = valor.split('/');
      if (partes.length === 3) {
        const dia = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10) - 1;
        const ano = parseInt(partes[2], 10);
        return new Date(ano, mes, dia);
      }
    }
    return new Date(valor);
  }

  fechar() {
    this.dialogRef.close();
  }
}
