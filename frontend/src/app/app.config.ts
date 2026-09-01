import {
  APP_INITIALIZER,
  ApplicationConfig,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { firstValueFrom } from 'rxjs';
import { authInterceptor } from './interceptors/auth.interceptor';
import { AuthService } from './services/auth.service';

import { routes } from './app.routes';

function initializeAuth(authService: AuthService) {
  return () => firstValueFrom(authService.checkAuth());
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuth,
      deps: [AuthService],
      multi: true,
    },
  ],
};
