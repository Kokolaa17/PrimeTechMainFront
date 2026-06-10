import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ApiConnectionInterceptorService } from '../Services/api-connection-interceptor-service';
import { finalize } from 'rxjs';

export const apiConnectionInterceptor: HttpInterceptorFn = (req, next) => {
  const _apiConnectionService = inject(ApiConnectionInterceptorService);

  _apiConnectionService.ApiConnectionStarted();

  return next(req).pipe(
    finalize(() => {
      _apiConnectionService.ApiConnectionFinished();
    })
  );
};
