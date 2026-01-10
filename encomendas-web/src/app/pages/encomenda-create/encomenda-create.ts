import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

// Imports do Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';

// Imports das Diretivas de Máscara
import { CepMaskDirective } from '../../core/directives/cep-mask.directive';
import { CpfMaskDirective } from '../../core/directives/cpf-mask.directive';
import { PhoneMaskDirective } from '../../core/directives/phone-mask.directive';
import { DateMaskDirective } from '../../core/directives/date-mask.directive';

import { EncomendaService } from '../../core/services/encomenda.service';
import { CepService } from '../../core/services/cep.service';

@Component({
  selector: 'app-encomenda-create',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, RouterModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatDatepickerModule, MatNativeDateModule,
    MatCheckboxModule, MatDividerModule,
    // Diretivas
    CepMaskDirective, CpfMaskDirective, PhoneMaskDirective, DateMaskDirective
  ],
  templateUrl: './encomenda-create.html',
  styleUrls: ['./encomenda-create.scss']
})
export class EncomendaCreate implements OnInit {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private encomendaService: EncomendaService,
    private cepService: CepService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      // -- CLIENTE --
      cliente: this.fb.group({
        nome: ['', Validators.required],
        codigoInterno: [''],
        cpf: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        telefone: ['', Validators.required]
      }),

      // -- ENDEREÇO --
      enderecoCep: ['', [Validators.required, Validators.minLength(8)]],
      enderecoBairro: ['', Validators.required],
      enderecoRua: ['', Validators.required],
      enderecoNumero: ['', Validators.required],
      enderecoComplemento: [''],

      // -- DETALHES (DATA AGORA É OBRIGATÓRIA) --
      dataEstimadaEntrega: [null, Validators.required],
      horaEstimadaEntrega: [''],
      observacoes: [''],

      // -- FLAGS --
      notaFutura: [false],
      vendaEstoqueNegativo: [false],

      // -- ITENS --
      itens: this.fb.array([], Validators.required),

      // -- PAGAMENTO --
      valorTotal: [{ value: 0, disabled: true }],
      quitado: [false],
      valorAdiantamento: [0]
    });
  }

  ngOnInit(): void {
    this.adicionarItem(); // Item inicial

    this.form.get('quitado')?.valueChanges.subscribe(isQuitado => {
      const adiantamentoControl = this.form.get('valorAdiantamento');
      if (isQuitado) {
        adiantamentoControl?.setValue(this.calcularTotalItens());
        adiantamentoControl?.disable();
      } else {
        adiantamentoControl?.enable();
        adiantamentoControl?.setValue(0);
      }
    });
  }

  buscarCep() {
    const rawCep = this.form.get('enderecoCep')?.value?.replace(/\D/g, '') || '';
    if (rawCep.length === 8) {
      this.cepService.buscarCep(rawCep).subscribe(dados => {
        if (dados && !dados.erro) {
          this.form.patchValue({
            enderecoRua: dados.logradouro,
            enderecoBairro: dados.bairro,
          });
          this.snackBar.open('Endereço encontrado!', 'OK', { duration: 2000 });
        }
      });
    }
  }

  get itensFormArray() {
    return this.form.get('itens') as FormArray;
  }

  adicionarItem() {
    const itemGroup = this.fb.group({
      produto: this.fb.group({
        nome: ['', Validators.required],
        codigo: ['']
      }),
      fornecedor: this.fb.group({
        nome: ['', Validators.required]
      }),
      quantidade: [1, [Validators.required, Validators.min(1)]],
      precoCotado: [0, Validators.required],
      descricaoOpcional: ['']
    });

    itemGroup.get('quantidade')?.valueChanges.subscribe(() => this.atualizarTotais());
    itemGroup.get('precoCotado')?.valueChanges.subscribe(() => this.atualizarTotais());

    this.itensFormArray.push(itemGroup);
  }

  removerItem(index: number) {
    this.itensFormArray.removeAt(index);
    this.atualizarTotais();
  }

  atualizarTotais() {
    const total = this.calcularTotalItens();
    this.form.get('valorTotal')?.setValue(total);

    if (this.form.get('quitado')?.value) {
      this.form.get('valorAdiantamento')?.setValue(total);
    }
  }

  calcularTotalItens(): number {
    return this.itensFormArray.controls.reduce((acc, control) => {
      const qtd = control.get('quantidade')?.value || 0;
      const preco = control.get('precoCotado')?.value || 0;
      return acc + (qtd * preco);
    }, 0);
  }

  private limparFormatacao(valor: string): string {
    return valor ? valor.replace(/\D/g, '') : '';
  }

  // --- PARSER DE DATA BRASILEIRA (Para suportar digitação) ---
  private parseDataBR(valor: any): Date | null {
    if (!valor) return null;

    // Se já for Date (via datepicker)
    if (valor instanceof Date) return valor;

    // Se for string (via digitação com máscara DD/MM/AAAA)
    if (typeof valor === 'string') {
      // Verifica se é formato ISO
      if (!isNaN(Date.parse(valor))) {
         return new Date(valor);
      }

      const partes = valor.split('/');
      if (partes.length === 3) {
        const dia = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10) - 1; // Mês começa em 0
        const ano = parseInt(partes[2], 10);

        const dataObj = new Date(ano, mes, dia);
        if (!isNaN(dataObj.getTime())) {
          return dataObj;
        }
      }
    }
    return null;
  }

  salvar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Verifique os campos obrigatórios em vermelho.', 'Fechar', { duration: 3000 });
      return;
    }

    const formVal = this.form.getRawValue();

    // Normalização dos dados
    formVal.cliente.cpf = this.limparFormatacao(formVal.cliente.cpf);
    formVal.cliente.telefone = this.limparFormatacao(formVal.cliente.telefone);
    formVal.enderecoCep = this.limparFormatacao(formVal.enderecoCep);

    // --- LÓGICA DE DATA ATUALIZADA ---
    let dataFinal = null;
    const dataObj = this.parseDataBR(formVal.dataEstimadaEntrega);

    if (dataObj) {
      if (formVal.horaEstimadaEntrega) {
        const [horas, minutos] = formVal.horaEstimadaEntrega.split(':');
        dataObj.setHours(+horas);
        dataObj.setMinutes(+minutos);
      }
      dataFinal = dataObj.toISOString();
    } else {
        this.snackBar.open('Data inválida. Use o formato DD/MM/AAAA.', 'Corrigir', { duration: 3000 });
        return;
    }

    const payload = {
      ...formVal,
      dataEstimadaEntrega: dataFinal
    };

    this.encomendaService.criarEncomenda(payload).subscribe({
      next: () => {
        this.snackBar.open('Encomenda criada com sucesso!', 'OK', { duration: 3000 });
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open('Erro ao criar encomenda.', 'Fechar', { duration: 5000 });
      }
    });
  }
}
