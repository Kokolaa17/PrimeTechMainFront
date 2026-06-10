import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { ApiConnectionService } from '../Services/api-connection-service';
import { map } from 'rxjs';

export const brandsResolver: ResolveFn<any> = (route, state) => {
  const _http = inject(ApiConnectionService)
  return _http.getAllBrands().pipe(
    map(res => res.data)
  );
};
