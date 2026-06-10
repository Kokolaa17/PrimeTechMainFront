import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { catchError, forkJoin, map, of } from 'rxjs';
import { ApiConnectionService } from '../Services/api-connection-service';

export interface BrandCategoryPayload {
  brands: any[];
  categories: any[];
}

export const brandsAndCategoriesResolver: ResolveFn<BrandCategoryPayload> = (route, state) => {
  const apiService = inject(ApiConnectionService); 

  return forkJoin({
  
    brands: apiService.getAllBrands().pipe(
      map(res => res.data ?? res), 
    ),
    categories: apiService.getAllCategories().pipe(
      map(res => res.data ?? res),
      catchError(() => of([]))
    )
  });
};