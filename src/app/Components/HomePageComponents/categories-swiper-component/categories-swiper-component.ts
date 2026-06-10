import { Component, CUSTOM_ELEMENTS_SCHEMA, effect, inject, Input, signal } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { ApiConnectionService } from '../../../Services/api-connection-service';
import { ModalService } from '../../../Services/modal-service';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { TranslateModule } from '@ngx-translate/core';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-categories-swiper-component',
  imports: [TranslateModule, DecimalPipe],
  templateUrl: './categories-swiper-component.html',
  styleUrl: './categories-swiper-component.scss',
  schemas : [CUSTOM_ELEMENTS_SCHEMA]
})
export class CategoriesSwiperComponent {
  @Input() categoryData!: any; 

  private readonly _http = inject(ApiConnectionService);
  private readonly _modalService = inject(ModalService);
  private readonly _router = inject(Router);

  addToCartErrors = signal<Map<number, string>>(new Map());
  addToCartSuccess = signal<Map<number, string>>(new Map());
  products = signal<any[]>([]);

  ngOnInit(): void {
    if (this.categoryData?.id) {
      this._http.getProductByCategory(this.categoryData.id).subscribe((res: any) => {
        this.products.set(res.data);
      });
    }
  }

  isNew(createdAt: Date): boolean {
    const days = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
    return days < 7;
  }

  getStars(rating: number): string {
    const full = Math.round(rating);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }

  getDiscountPercent(oldPrice: number, price: number): number {
    if (!oldPrice || oldPrice <= price) return 0;

    return Math.round(((oldPrice - price) / oldPrice) * 100);
  }

  goToCategory(categoryId: number) {
    this._router.navigate(['/category', categoryId]);
  }

  goToDetails(productId: number) {
    this._router.navigate(['/product', productId]);
  }

  addToCart(productId: number) {
    const userId = this._modalService.loggedInUserId();
    if (!userId) {
      this._modalService.openLogInModal();
      return;
    }

    this._http.addToCart(userId, productId).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.addToCartSuccess.update(map => {
            this._modalService.openCartModal()
            this._modalService.triggerCartRefresh();
            const updated = new Map(map);
            updated.set(productId, 'added');
            return updated;
          });

          setTimeout(() => {
            this.addToCartSuccess.update(map => {
              const updated = new Map(map);
              updated.delete(productId);
              return updated;
            });
          }, 2000);
        } else {
          this.addToCartErrors.update(map => {
            const updated = new Map(map);
            updated.set(productId, res.message ?? 'Failed to add to cart');
            return updated;
          });
        }
      },
      error: (err) => {
        this.addToCartErrors.update(map => {
          const updated = new Map(map);
          updated.set(productId, err.error?.message ?? 'Something went wrong');
          return updated;
        });
      }
    });
  }
}
