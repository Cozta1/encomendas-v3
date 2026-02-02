import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChecklistService } from '../../core/services/checklist.service';
import { TeamService } from '../../core/team/team.service';
import { ChecklistBoard, ChecklistItem, ChecklistLogRequest } from '../../core/models/checklist.interfaces';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-checklist-dia',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatCheckboxModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './checklist-dia.html',
  styleUrls: ['./checklist-dia.scss']
})
export class ChecklistDiaComponent implements OnInit {
  boards: ChecklistBoard[] = [];
  loading = true;
  equipeId: string | null = null;
  dataHoje: Date = new Date();

  constructor(
    private checklistService: ChecklistService,
    private teamService: TeamService
  ) {}

  ngOnInit(): void {
    // --- CORREÇÃO AQUI ---
    // Usamos getEquipeAtivaId() que existe no seu TeamService
    const id = this.teamService.getEquipeAtivaId();

    if (id) {
      this.equipeId = id;
      this.carregarChecklist();
    } else {
      console.error('Nenhuma equipe selecionada');
      this.loading = false;
    }
  }

  carregarChecklist(): void {
    if (!this.equipeId) return;

    this.loading = true;
    this.checklistService.getChecklistDoDia(this.equipeId)
      .subscribe({
        next: (data) => {
          this.boards = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('Erro ao carregar checklist', err);
          this.loading = false;
        }
      });
  }

  onItemChange(item: ChecklistItem, event: any): void {
    const novoValor = event.checked;

    const valorOriginal = item.marcado;
    item.marcado = novoValor;

    const request: ChecklistLogRequest = {
      itemId: item.id,
      dataReferencia: new Date().toISOString().split('T')[0],
      valor: novoValor
    };

    this.checklistService.registrarAcao(request).subscribe({
      error: (err) => {
        console.error('Erro ao marcar item', err);
        item.marcado = valorOriginal;
        alert('Erro ao salvar alteração. Tente novamente.');
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'ABERTO': return 'status-aberto';
      case 'FECHADO': return 'status-fechado';
      case 'PENDENTE': return 'status-pendente';
      default: return '';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'ABERTO': return 'Disponível';
      case 'FECHADO': return 'Encerrado';
      case 'PENDENTE': return 'Aguardando Horário';
      default: return status;
    }
  }

  isBloqueado(status: string): boolean {
    return status !== 'ABERTO';
  }
}
