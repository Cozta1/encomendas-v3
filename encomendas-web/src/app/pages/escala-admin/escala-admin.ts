import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { TeamService } from '../../core/team/team.service';
import { EscalaService } from '../../core/services/escala.service';
import { EscalaFormDialog } from '../../components/dialogs/escala-form-dialog/escala-form-dialog';
import { UsuarioResponse } from '../../core/models/usuario.interfaces';
import { EscalaReplicacao, EscalaReplicacaoMassa, EscalaTrabalho } from '../../core/models/escala.interfaces';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface DiaAdmin {
  data: Date;
  diaMes: number;
  escala?: EscalaTrabalho;
  isOutroMes: boolean;
  isHoje: boolean;
}

@Component({
  selector: 'app-escala-admin',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatFormFieldModule,
    MatSelectModule, MatButtonModule, MatIconModule, MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './escala-admin.html',
  styleUrls: ['./escala-admin.scss']
})
export class EscalaAdminComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();
  membros: UsuarioResponse[] = [];
  usuarioSelecionadoId: number | null = null;

  // Seleção múltipla para operações em massa
  membrosSelecionadosIds = new Set<number>();

  dataAtual: Date = new Date();
  dias: DiaAdmin[] = [];
  escalas: EscalaTrabalho[] = [];
  diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  loading = false;

  constructor(
    private teamService: TeamService,
    private escalaService: EscalaService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.carregarMembros();
    this.gerarCalendario();
  }

  carregarMembros() {
    const equipeId = this.teamService.getEquipeAtivaId();
    if (equipeId) {
      this.teamService.getMembros(equipeId).pipe(takeUntil(this.destroy$)).subscribe({
        next: (data) => this.membros = data,
        error: () => this.snackBar.open('Erro ao carregar membros.', 'Fechar', { duration: 3000 })
      });
    }
  }

  // --- Seleção de funcionários ---

  toggleMembro(id: number) {
    if (this.membrosSelecionadosIds.has(id)) {
      this.membrosSelecionadosIds.delete(id);
    } else {
      this.membrosSelecionadosIds.add(id);
    }
  }

  selecionarTodos() {
    this.membros.forEach(m => this.membrosSelecionadosIds.add(m.id));
  }

  limparSelecao() {
    this.membrosSelecionadosIds.clear();
  }

  getNomesSelecionados(): string {
    const nomes = this.membros
      .filter(m => this.membrosSelecionadosIds.has(m.id))
      .map(m => m.nomeCompleto.split(' ')[0]);

    if (nomes.length <= 5) {
      return nomes.join(', ');
    }
    return nomes.slice(0, 5).join(', ') + ` e mais ${nomes.length - 5}`;
  }

  // --- Navegação ---

  onUsuarioChange() {
    this.carregarEscalas();
  }

  mesAnterior() {
    this.dataAtual = new Date(this.dataAtual.getFullYear(), this.dataAtual.getMonth() - 1, 1);
    this.gerarCalendario();
    this.carregarEscalas();
  }

  proximoMes() {
    this.dataAtual = new Date(this.dataAtual.getFullYear(), this.dataAtual.getMonth() + 1, 1);
    this.gerarCalendario();
    this.carregarEscalas();
  }

  get mesAnoTitulo(): string {
    return this.dataAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }

  carregarEscalas() {
    if (!this.usuarioSelecionadoId) return;

    this.loading = true;
    const inicio = new Date(this.dataAtual.getFullYear(), this.dataAtual.getMonth(), 1);
    const fim = new Date(this.dataAtual.getFullYear(), this.dataAtual.getMonth() + 1, 0);

    const inicioStr = this.formatDate(inicio);
    const fimStr = this.formatDate(fim);

    this.escalaService.getEscalas(this.usuarioSelecionadoId, inicioStr, fimStr).pipe(takeUntil(this.destroy$)).subscribe({
      next: (dados) => {
        this.escalas = dados;
        this.atualizarDiasComEscala();
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  gerarCalendario() {
    this.dias = [];
    const ano = this.dataAtual.getFullYear();
    const mes = this.dataAtual.getMonth();
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    const diaSemanaInicio = primeiroDia.getDay();

    for (let i = diaSemanaInicio; i > 0; i--) {
      const d = new Date(ano, mes, 1 - i);
      this.dias.push(this.criarDia(d, true));
    }

    for (let i = 1; i <= ultimoDia.getDate(); i++) {
      const d = new Date(ano, mes, i);
      this.dias.push(this.criarDia(d, false));
    }
  }

  criarDia(data: Date, isOutroMes: boolean): DiaAdmin {
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
      dia.escala = escala;
    });
  }

  // --- AÇÕES DO DIALOG ---

  editarDia(dia: DiaAdmin) {
    const temSelecao = this.membrosSelecionadosIds.size > 0;

    if (!temSelecao && !this.usuarioSelecionadoId) {
      this.snackBar.open('Selecione funcionários ou escolha um para visualizar.', 'Fechar', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(EscalaFormDialog, {
      width: '450px',
      data: { data: dia.data, escala: dia.escala }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (temSelecao && result.replicacao) {
          this.salvarReplicacaoMassa(result.replicacao);
        } else if (temSelecao) {
          this.salvarEscalaMassaSimples(result.single);
        } else if (result.replicacao) {
          this.salvarReplicacao(result.replicacao);
        } else {
          this.salvarEscalaSimples(result.single);
        }
      }
    });
  }

  salvarEscalaSimples(dados: any) {
    const payload: EscalaTrabalho = {
      usuarioId: this.usuarioSelecionadoId!,
      data: this.formatDate(new Date(dados.data)),
      tipo: dados.tipo,
      horarioInicio: dados.horarioInicio ? this.formatTime(dados.horarioInicio) : undefined,
      horarioFim: dados.horarioFim ? this.formatTime(dados.horarioFim) : undefined,
      observacao: dados.observacao
    };

    this.escalaService.salvarEscala(payload).subscribe({
      next: () => {
        this.snackBar.open('Escala atualizada!', 'OK', { duration: 2000 });
        this.carregarEscalas();
      },
      error: () => this.snackBar.open('Erro ao salvar.', 'Fechar')
    });
  }

  salvarReplicacao(dadosRep: any) {
    if (!dadosRep.dataInicio || !dadosRep.dataFim) {
      this.snackBar.open('Datas inválidas para replicação.', 'Fechar');
      return;
    }

    const payload: EscalaReplicacao = {
      usuarioId: this.usuarioSelecionadoId!,
      dataInicio: this.formatDate(new Date(dadosRep.dataInicio)),
      dataFim: this.formatDate(new Date(dadosRep.dataFim)),
      diasSemana: dadosRep.diasSemana,
      tipo: dadosRep.tipo,
      horarioInicio: dadosRep.horarioInicio ? this.formatTime(dadosRep.horarioInicio) : undefined,
      horarioFim: dadosRep.horarioFim ? this.formatTime(dadosRep.horarioFim) : undefined,
      observacao: dadosRep.observacao
    };

    this.loading = true;
    this.escalaService.replicarEscala(payload).subscribe({
      next: () => {
        this.snackBar.open('Escala replicada com sucesso!', 'OK', { duration: 3000 });
        this.carregarEscalas();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao replicar:', err);
        this.snackBar.open('Erro ao replicar escala.', 'Fechar');
        this.loading = false;
      }
    });
  }

  salvarEscalaMassaSimples(dados: any) {
    const ids = Array.from(this.membrosSelecionadosIds);
    const dataStr = this.formatDate(new Date(dados.data));

    const payload: EscalaReplicacaoMassa = {
      usuarioIds: ids,
      dataInicio: dataStr,
      dataFim: dataStr,
      diasSemana: [1, 2, 3, 4, 5, 6, 7],
      tipo: dados.tipo,
      horarioInicio: dados.horarioInicio ? this.formatTime(dados.horarioInicio) : undefined,
      horarioFim: dados.horarioFim ? this.formatTime(dados.horarioFim) : undefined,
      observacao: dados.observacao
    };

    this.loading = true;
    this.escalaService.replicarEscalaMassa(payload).subscribe({
      next: () => {
        this.snackBar.open(`Escala aplicada a ${ids.length} funcionários!`, 'OK', { duration: 3000 });
        this.carregarEscalas();
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Erro ao aplicar escala em massa.', 'Fechar');
        this.loading = false;
      }
    });
  }

  salvarReplicacaoMassa(dadosRep: any) {
    if (!dadosRep.dataInicio || !dadosRep.dataFim) {
      this.snackBar.open('Datas inválidas para replicação.', 'Fechar');
      return;
    }

    const ids = Array.from(this.membrosSelecionadosIds);

    const payload: EscalaReplicacaoMassa = {
      usuarioIds: ids,
      dataInicio: this.formatDate(new Date(dadosRep.dataInicio)),
      dataFim: this.formatDate(new Date(dadosRep.dataFim)),
      diasSemana: dadosRep.diasSemana,
      tipo: dadosRep.tipo,
      horarioInicio: dadosRep.horarioInicio ? this.formatTime(dadosRep.horarioInicio) : undefined,
      horarioFim: dadosRep.horarioFim ? this.formatTime(dadosRep.horarioFim) : undefined,
      observacao: dadosRep.observacao
    };

    this.loading = true;
    this.escalaService.replicarEscalaMassa(payload).subscribe({
      next: () => {
        this.snackBar.open(`Escala replicada para ${ids.length} funcionários!`, 'OK', { duration: 3000 });
        this.carregarEscalas();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao replicar em massa:', err);
        this.snackBar.open('Erro ao replicar escala em massa.', 'Fechar');
        this.loading = false;
      }
    });
  }

  // --- HELPERS ---

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private formatTime(time: string): string {
    if (time && time.length === 5) {
      return time + ':00';
    }
    return time;
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}