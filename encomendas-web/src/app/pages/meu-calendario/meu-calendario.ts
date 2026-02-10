import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EscalaService } from '../../core/services/escala.service';
import { AuthService } from '../../core/auth/auth.service';
import { EscalaTrabalho } from '../../core/models/escala.interfaces';

interface DiaCalendario {
  data: Date;
  diaMes: number;
  escala?: EscalaTrabalho;
  isOutroMes: boolean;
  isHoje: boolean;
}

@Component({
  selector: 'app-meu-calendario',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './meu-calendario.html',
  styleUrls: ['./meu-calendario.scss']
})
export class MeuCalendarioComponent implements OnInit {

  dataAtual: Date = new Date();
  dias: DiaCalendario[] = [];
  escalas: EscalaTrabalho[] = [];
  diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  loading = false;

  constructor(
    private escalaService: EscalaService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.atualizarVisualizacao();
  }

  mesAnterior() {
    this.dataAtual = new Date(this.dataAtual.getFullYear(), this.dataAtual.getMonth() - 1, 1);
    this.atualizarVisualizacao();
  }

  proximoMes() {
    this.dataAtual = new Date(this.dataAtual.getFullYear(), this.dataAtual.getMonth() + 1, 1);
    this.atualizarVisualizacao();
  }

  atualizarVisualizacao() {
    this.gerarCalendario(); // Gera a grade vazia
    this.carregarEscalas(); // Busca os dados
  }

  get mesAnoTitulo(): string {
    return this.dataAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }

  carregarEscalas() {
    const user = this.authService.getUser();
    if (!user) return;

    this.loading = true;

    // Intervalo (Primeiro ao último dia do mês)
    const inicio = new Date(this.dataAtual.getFullYear(), this.dataAtual.getMonth(), 1);
    const fim = new Date(this.dataAtual.getFullYear(), this.dataAtual.getMonth() + 1, 0);

    const inicioStr = this.formatDate(inicio);
    const fimStr = this.formatDate(fim);

    console.log(`Buscando escalas para User ${user.id} de ${inicioStr} até ${fimStr}`);

    this.escalaService.getEscalas(user.id, inicioStr, fimStr).subscribe({
      next: (dados) => {
        console.log('Escalas recebidas:', dados);
        this.escalas = dados;
        this.atualizarDiasComEscala();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao buscar escalas', err);
        this.loading = false;
      }
    });
  }

  gerarCalendario() {
    // Importante: Reinicia o array
    const novosDias: DiaCalendario[] = [];

    const ano = this.dataAtual.getFullYear();
    const mes = this.dataAtual.getMonth();

    const primeiroDiaDoMes = new Date(ano, mes, 1);
    const ultimoDiaDoMes = new Date(ano, mes + 1, 0);
    const diaSemanaInicio = primeiroDiaDoMes.getDay();

    // Dias do mês anterior
    for (let i = diaSemanaInicio; i > 0; i--) {
      const d = new Date(ano, mes, 1 - i);
      novosDias.push(this.criarDia(d, true));
    }

    // Dias do mês atual
    for (let i = 1; i <= ultimoDiaDoMes.getDate(); i++) {
      const d = new Date(ano, mes, i);
      novosDias.push(this.criarDia(d, false));
    }

    this.dias = novosDias;
  }

  criarDia(data: Date, isOutroMes: boolean): DiaCalendario {
    const hoje = new Date();
    return {
      data: data,
      diaMes: data.getDate(),
      isOutroMes: isOutroMes,
      isHoje: data.getDate() === hoje.getDate() &&
              data.getMonth() === hoje.getMonth() &&
              data.getFullYear() === hoje.getFullYear()
    };
  }

  atualizarDiasComEscala() {
    // Vamos iterar e atualizar.
    // Usamos map para criar um novo array e forçar o Angular a detectar a mudança.
    this.dias = this.dias.map(dia => {

      const escalaEncontrada = this.escalas.find(e => this.datasIguais(dia.data, e.data));

      // Debug apenas no dia 1 para não poluir o console
      if (dia.diaMes === 1 && !dia.isOutroMes) {
         console.log('Comparando dia 1:', dia.data, 'Escala encontrada:', escalaEncontrada);
      }

      return {
        ...dia,
        escala: escalaEncontrada
      };
    });
  }

  // --- COMPARADOR ROBUSTO ---
  // Compara Date do calendário com (String ou Array ou Date) da API
  datasIguais(dataCalendario: Date, dataApi: any): boolean {
    if (!dataApi) return false;

    const anoCal = dataCalendario.getFullYear();
    const mesCal = dataCalendario.getMonth() + 1; // 0-11 vira 1-12
    const diaCal = dataCalendario.getDate();

    // Caso 1: String "YYYY-MM-DD"
    if (typeof dataApi === 'string') {
      const partes = dataApi.split('-'); // [2026, 02, 01]
      return parseInt(partes[0]) === anoCal &&
             parseInt(partes[1]) === mesCal &&
             parseInt(partes[2]) === diaCal;
    }

    // Caso 2: Array [2026, 2, 1]
    if (Array.isArray(dataApi)) {
      return dataApi[0] === anoCal &&
             dataApi[1] === mesCal &&
             dataApi[2] === diaCal;
    }

    // Caso 3: Objeto Date (improvável vir do JSON, mas possível se tratado antes)
    if (dataApi instanceof Date) {
      return dataApi.getFullYear() === anoCal &&
             (dataApi.getMonth() + 1) === mesCal &&
             dataApi.getDate() === diaCal;
    }

    return false;
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  getClasseTipo(tipo?: string): string {
    switch (tipo) {
      case 'TRABALHO': return 'dia-trabalho';
      case 'FOLGA': return 'dia-folga';
      case 'FERIAS': return 'dia-ferias';
      case 'ATESTADO': return 'dia-atestado';
      default: return '';
    }
  }

  getIcone(tipo?: string): string {
    switch (tipo) {
      case 'TRABALHO': return 'work';
      case 'FOLGA': return 'weekend';
      case 'FERIAS': return 'beach_access';
      case 'ATESTADO': return 'local_hospital';
      default: return '';
    }
  }
}
