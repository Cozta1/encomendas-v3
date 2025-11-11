import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet // Essencial para as rotas funcionarem
  ],
  templateUrl: './app.html', // Apontando para o seu HTML
  styleUrl: './app.scss'      // Apontando para o seu SCSS
})
export class AppComponent {
  title = 'encomendas-web';
}
