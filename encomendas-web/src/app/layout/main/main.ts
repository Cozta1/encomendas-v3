import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
// Correção aqui:
import { Navbar } from '../navbar/navbar'; // <-- Sem .component e classe simplificada
import { Sidebar } from '../sidebar/sidebar'; // <-- Sem .component e classe simplificada

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    RouterOutlet,
    MatSidenavModule,
    Navbar,  // <-- Classe simplificada
    Sidebar  // <-- Classe simplificada
  ],
  templateUrl: './main.html',
  styleUrl: './main.scss'
})
export class Main { // <-- O nome da classe principal também deve ser simplificado
  // Verifique no seu ficheiro se o CLI gerou "export class Main"
}
