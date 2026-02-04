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
    this.gerarCalendario();
    this.carregarEscalas();
  }

  get mesAnoTitulo(): string {
    return this.dataAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }

  carregarEscalas() {
    const user = this.authService.getUser();
    if (!user) {
      console.error('Usuário não autenticado ou não encontrado no AuthService');
      return;
    }

    this.loading = true;

    // Define intervalo para busca (Mês completo)
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
        console.error('Erro ao buscar escalas:', err);
        this.loading = false;
      }
    });
  }

  gerarCalendario() {
    this.dias = [];
    const ano = this.dataAtual.getFullYear();
    const mes = this.dataAtual.getMonth();

    const primeiroDiaDoMes = new Date(ano, mes, 1);
    const ultimoDiaDoMes = new Date(ano, mes + 1, 0);

    const diaSemanaInicio = primeiroDiaDoMes.getDay();

    for (let i = diaSemanaInicio; i > 0; i--) {
      const d = new Date(ano, mes, 1 - i);
      this.dias.push(this.criarDia(d, true));
    }

    for (let i = 1; i <= ultimoDiaDoMes.getDate(); i++) {
      const d = new Date(ano, mes, i);
      this.dias.push(this.criarDia(d, false));
    }
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
    this.dias.forEach(dia => {
      // Formato String esperado: "YYYY-MM-DD"
      const dataStr = this.formatDate(dia.data);

      // Tenta encontrar escala compatível
      const escala = this.escalas.find(e => {
        // Caso 1: Data vem como string "2026-02-04" (Com @JsonFormat)
        if (typeof e.data === 'string') {
          return e.data === dataStr;
        }
        // Caso 2: Data vem como Array [2026, 2, 4] (Sem @JsonFormat ou erro de config)
        if (Array.isArray(e.data)) {
          const ano = e.data[0];
          const mes = e.data[1]; // No Java Array, mês 1 = Janeiro? Geralmente sim no LocalDate
          const diaMes = e.data[2];

          return ano === dia.data.getFullYear() &&
                 mes === (dia.data.getMonth() + 1) &&
                 diaMes === dia.data.getDate();
        }
        return false;
      });

      if (escala) {
        dia.escala = escala;
      } else {
        dia.escala = undefined;
      }
    });
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
