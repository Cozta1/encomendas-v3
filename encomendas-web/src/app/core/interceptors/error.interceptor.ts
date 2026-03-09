import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // authInterceptor handles redirect to login
      } else if (error.status === 403) {
        snackBar.open('Sem permissão para esta ação', 'Fechar', { duration: 4000 });
      } else if (error.status === 0 || error.status >= 500) {
        snackBar.open('Erro de servidor. Tente novamente.', 'Fechar', { duration: 4000 });
      } else if (error.status === 404) {
        console.warn('Recurso não encontrado:', req.url);
      }
      return throwError(() => error);
    })
  );
};
