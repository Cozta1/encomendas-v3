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
import { DateMaskDirective } from '../../core/directives/date-mask.directive'; // Ajuste o caminho

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
    // Diretivas adicionadas aqui
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
      // -- CLIENTE (Todos Obrigatórios) --
      cliente: this.fb.group({
        nome: ['', Validators.required],
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

      // -- DETALHES --
      dataEstimadaEntrega: [null],
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

    // Lógica do Checkbox "Quitado"
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

  // --- BUSCA CEP AUTOMÁTICA ---
  buscarCep() {
    // Remove mascara para verificar tamanho
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

  // --- GESTÃO DE ITENS ---
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

  // --- CÁLCULOS ---
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

  // --- MÉTODOS AUXILIARES DE NORMALIZAÇÃO ---
  private limparFormatacao(valor: string): string {
    return valor ? valor.replace(/\D/g, '') : '';
  }

  // --- SUBMIT ---
  salvar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Verifique os campos obrigatórios em vermelho.', 'Fechar', { duration: 3000 });
      return;
    }

    const formVal = this.form.getRawValue();

    // 1. Normalização dos dados (Remove máscaras)
    formVal.cliente.cpf = this.limparFormatacao(formVal.cliente.cpf);
    formVal.cliente.telefone = this.limparFormatacao(formVal.cliente.telefone);
    formVal.enderecoCep = this.limparFormatacao(formVal.enderecoCep);

    // 2. Combinar Data e Hora
    let dataFinal = null;
    if (formVal.dataEstimadaEntrega) {
      const data = new Date(formVal.dataEstimadaEntrega);
      if (formVal.horaEstimadaEntrega) {
        const [horas, minutos] = formVal.horaEstimadaEntrega.split(':');
        data.setHours(+horas);
        data.setMinutes(+minutos);
      }
      dataFinal = data.toISOString();
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
