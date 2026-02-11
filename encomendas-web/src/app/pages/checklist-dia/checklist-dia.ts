import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ChecklistService } from '../../core/services/checklist.service';
import { TeamService } from '../../core/team/team.service';
import { AuthService } from '../../core/auth/auth.service';
import { ChecklistBoard, ChecklistCard } from '../../core/models/checklist.interfaces';
import { ChecklistCardDialog } from '../../components/dialogs/checklist-card-dialog/checklist-card-dialog';
// Novos imports
import { EscalaService } from '../../core/services/escala.service';
import { EscalaTrabalho, TipoEscala } from '../../core/models/escala.interfaces';

@Component({
  selector: 'app-checklist-dia',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressBarModule,
    MatDialogModule,
    MatTooltipModule
  ],
  templateUrl: './checklist-dia.html',
  styleUrls: ['./checklist-dia.scss']
})
export class ChecklistDiaComponent implements OnInit {

  boards: ChecklistBoard[] = [];
  loading = false;
  dataAtual = new Date();

  // Estado da Escala do dia
  escalaHoje: EscalaTrabalho | null = null;
  tipoEscalaEnum = TipoEscala; // Para usar no HTML

  constructor(
    private checklistService: ChecklistService,
    private teamService: TeamService,
    private authService: AuthService,
    private escalaService: EscalaService, // Injeção do serviço de escala
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados() {
    const equipeId = this.teamService.getEquipeAtivaId();
    const user = this.authService.getUser();

    if (equipeId && user) {
      this.loading = true;
      const hojeStr = this.formatDate(this.dataAtual);

      // 1. Busca a Escala do dia primeiro
      this.escalaService.getEscalas(user.id, hojeStr, hojeStr).subscribe({
        next: (escalas) => {
          // Pega a primeira escala encontrada (deve haver apenas uma por dia por usuário)
          this.escalaHoje = escalas.length > 0 ? escalas[0] : null;

          // 2. Decide se carrega os checklists baseando-se na escala
          if (this.escalaHoje && this.escalaHoje.tipo !== TipoEscala.TRABALHO) {
            // Se for Folga, Férias ou Atestado, não precisa carregar tarefas
            this.loading = false;
            this.boards = [];
          } else {
            // Se for TRABALHO ou sem escala definida (assume trabalho), carrega os checklists
            this.carregarChecklists(equipeId, hojeStr, user.id);
          }
        },
        error: (err) => {
          console.error('Erro ao verificar escala', err);
          // Em caso de erro na escala, tenta carregar checklists por segurança
          this.carregarChecklists(equipeId, hojeStr, user.id);
        }
      });
    }
  }

  private carregarChecklists(equipeId: string, data: string, userId: number) {
    this.checklistService.getChecklistDoDia(equipeId, data, userId).subscribe({
      next: (dados) => {
        this.boards = dados;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar checklists', err);
        this.loading = false;
      }
    });
  }

  // Abre o Modal estilo Trello
  abrirCardDetalhado(card: ChecklistCard) {
    const user = this.authService.getUser();
    if (!user) return;

    const dialogRef = this.dialog.open(ChecklistCardDialog, {
      width: '768px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'trello-dialog-container',
      data: {
        card: card,
        usuarioId: user.id
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      this.carregarDados();
    });
  }

  // --- HELPERS VISUAIS ---

  countMarcados(card: ChecklistCard): number {
    if (!card.itens) return 0;
    return card.itens.filter(i => i.marcado).length;
  }

  getProgresso(card: ChecklistCard): number {
    if (!card.itens || card.itens.length === 0) return 0;
    const marcados = this.countMarcados(card);
    return (marcados / card.itens.length) * 100;
  }

  getStatusColor(card: ChecklistCard): string {
    if (this.getProgresso(card) === 100) return 'completed-badge';
    if (card.status === 'FECHADO') return 'closed-badge';
    return 'open-badge';
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
