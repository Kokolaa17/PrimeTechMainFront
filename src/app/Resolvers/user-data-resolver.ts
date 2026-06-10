import { ResolveFn } from '@angular/router';
import { ApiConnectionService } from '../Services/api-connection-service';
import { inject } from '@angular/core';

export const userDataResolver: ResolveFn<any> = (route, state) => {
  const _http  = inject(ApiConnectionService);
  return _http.getUserInfo(String(route.paramMap.get('userId')));
};
