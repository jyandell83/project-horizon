import { inject } from '@angular/core';
import type { HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(request).pipe(
    catchError((error) => {
      const isProtectedApiRequest =
        request.url.includes('/api/') && !request.url.includes('/api/auth/');

      if (error.status === 401 && isProtectedApiRequest) {
        authService.clearSession();
        router.navigate(['/login']);
      }

      return throwError(() => error);
    }),
  );
};
