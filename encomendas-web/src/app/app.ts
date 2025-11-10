import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
// Importe o módulo do botão Material
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-root',
  standalone: true,
  // Adicione MatButtonModule aos imports do componente
  imports: [RouterOutlet, MatButtonModule],
  templateUrl: './app.html',  // <--- Note o nome ajustado
  styleUrl: './app.scss'      // <--- Note o nome ajustado
})
export class AppComponent {
  title = 'encomendas-web';
}
