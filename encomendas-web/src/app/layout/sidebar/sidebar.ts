import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // <-- Importe o RouterModule

// Imports do Angular Material
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule, // <-- Adicione o RouterModule
    MatListModule,  // <-- Adicione o MatListModule
    MatIconModule   // <-- Adicione o MatIconModule
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar {
  // Por enquanto, a lógica fica vazia
}
