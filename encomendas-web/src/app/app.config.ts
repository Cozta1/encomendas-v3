import { ApplicationConfig, provideZoneChangeDetection, LOCALE_ID } from '@angular/core';
import { PreloadAllModules, provideRouter, withPreloading } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/auth/auth.interceptor';

// --- IMPORTS DE LOCALE (IDIOMA) ---
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { MAT_DATE_LOCALE } from '@angular/material/core';

// Registra o idioma português globalmente
registerLocaleData(localePt);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideAnimationsAsync(),

    // Interceptadores HTTP
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),

    // --- CONFIGURAÇÃO DE DATAS E IDIOMA ---
    { provide: LOCALE_ID, useValue: 'pt-BR' },      // Para Pipes do Angular (currency, date)
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' } // Para o Datepicker (formato visual)
  ]
};
