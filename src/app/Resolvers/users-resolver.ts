import { ResolveFn } from '@angular/router';
import { ApiConnectionService } from '../Services/api-connection-service';
import { inject } from '@angular/core';
import { map } from 'rxjs';

export const usersResolver: ResolveFn<any> = (route, state) => {
  const _http = inject(ApiConnectionService);
  return _http.getAllUsers().pipe(
    map(res => res.data),
  );
};
