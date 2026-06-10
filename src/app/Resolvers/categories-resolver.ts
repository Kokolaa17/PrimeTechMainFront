import { ResolveFn } from '@angular/router';
import { ApiConnectionService } from '../Services/api-connection-service';
import { inject } from '@angular/core';
import { map } from 'rxjs';

export const categoriesResolver: ResolveFn<any> = (route, state) => {
  const _http = inject(ApiConnectionService); 
   return _http.getAllCategories().pipe(
    map(res => res.data) 
  );
};
