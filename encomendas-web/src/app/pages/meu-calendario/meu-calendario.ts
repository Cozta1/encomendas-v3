import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EscalaService } from '../../core/services/escala.service';
import { AuthService } from '../../core/auth/auth.service';
import { EscalaTrabalho } from '../../core/models/escala.interfaces';

// ... interface DiaCalendario mantida ...
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

  constructor(
    private escalaService: EscalaService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.atualizarVisualizacao();
  }

  // --- CORREÇÃO AQUI: Lógica de Navegação ---
  mesAnterior() {
    // Subtrai 1 mês mantendo o dia 1 para evitar bugs de virada de mês (31/Jan -> Fev)
    this.dataAtual = new Date(this.dataAtual.getFullYear(), this.dataAtual.getMonth() - 1, 1);
    this.atualizarVisualizacao();
  }

  proximoMes() {
    // Soma 1 mês
    this.dataAtual = new Date(this.dataAtual.getFullYear(), this.dataAtual.getMonth() + 1, 1);
    this.atualizarVisualizacao();
  }

  atualizarVisualizacao() {
    this.gerarCalendario();
    this.carregarEscalas();
  }
  // ------------------------------------------

  get mesAnoTitulo(): string {
    return this.dataAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }

  carregarEscalas() {
    const user = this.authService.getUser();
    if (!user) return;

    const inicio = new Date(this.dataAtual.getFullYear(), this.dataAtual.getMonth(), 1);
    const fim = new Date(this.dataAtual.getFullYear(), this.dataAtual.getMonth() + 1, 0);

    // Ajuste de fuso horário para garantir que a string enviada seja correta
    const inicioStr = this.formatDate(inicio);
    const fimStr = this.formatDate(fim);

    this.escalaService.getEscalas(user.id, inicioStr, fimStr).subscribe(dados => {
      this.escalas = dados;
      this.atualizarDiasComEscala();
    });
  }

  // Helper para formatar YYYY-MM-DD
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  gerarCalendario() {
    this.dias = [];
    const ano = this.dataAtual.getFullYear();
    const mes = this.dataAtual.getMonth();

    const primeiroDiaDoMes = new Date(ano, mes, 1);
    const ultimoDiaDoMes = new Date(ano, mes + 1, 0);

    const diaSemanaInicio = primeiroDiaDoMes.getDay();

    // Dias do mês anterior
    for (let i = diaSemanaInicio; i > 0; i--) {
      const d = new Date(ano, mes, 1 - i);
      this.dias.push(this.criarDia(d, true));
    }

    // Dias do mês atual
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
      const dataStr = this.formatDate(dia.data);
      const escala = this.escalas.find(e => e.data === dataStr);
      if (escala) {
        dia.escala = escala;
      }
    });
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
