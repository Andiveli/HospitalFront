import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import localeEs from '@angular/common/locales/es-EC';
import {
  APP_INITIALIZER,
  type ApplicationConfig,
  inject,
  LOCALE_ID,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { apiUrlInterceptor } from './core/interceptors/api-url.interceptor';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { AuthService } from './core/services/auth.service';

// Register Spanish (Ecuador) locale
registerLocaleData(localeEs);

// Initialize app: load user profile if token exists
function initializeApp() {
  const authService = inject(AuthService);
  return () => authService.initialize();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideZonelessChangeDetection(),
    provideHttpClient(withInterceptors([apiUrlInterceptor, authInterceptor]), withFetch()),
    { provide: LOCALE_ID, useValue: 'es-EC' },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      multi: true,
    },
  ],
};
