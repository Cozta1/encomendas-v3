import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

// --- IMPORTS NOVOS ---
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/auth/auth.interceptor'; // <-- Nosso interceptor

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),

    // --- LINHA ATUALIZADA ---
    // Aqui nós dizemos ao Angular para usar nosso interceptor em todas as chamadas HTTP
    provideHttpClient(withFetch(), withInterceptors([authInterceptor]))
  ]
};
