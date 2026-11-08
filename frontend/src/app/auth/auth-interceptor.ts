import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const isApi = request.url.startsWith(environment.apiUrl + '/');
  if (isApi && auth.token())
    request = request.clone({ setHeaders: { Authorization: 'Bearer ' + auth.token() } });
  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (isApi && error.status === 401) {
        auth.logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    }),
  );
};
