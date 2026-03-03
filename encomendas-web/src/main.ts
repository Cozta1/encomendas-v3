// sockjs-client requires Node.js 'global' — polyfill for browser
(window as any).global = window;
import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app'; // <-- O nome correto é AppComponent

bootstrapApplication(AppComponent, appConfig) // <-- Use o nome correto aqui
  .catch((err) => console.error(err));
