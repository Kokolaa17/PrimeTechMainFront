import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiConnectionService } from '../../Services/api-connection-service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ModalService } from '../../Services/modal-service';
import { ReviewInterface } from '../../Interfaces/product-details-interface';

@Component({
  selector: 'app-product-details-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './product-details-page.html',
  styleUrl: './product-details-page.scss'
})
export class ProductDetailsPage implements OnInit {
  private readonly _activatedRoute = inject(ActivatedRoute);
  private readonly _router          = inject(Router);
  private readonly _apiService      = inject(ApiConnectionService);
  public  readonly _modalService    = inject(ModalService);

  // ─── Product State ────────────────────────────────────────────────────────
  product              = signal<any | null>(null);
  reviews              = signal<ReviewInterface[]>([]);
  isLoadingProduct     = signal<boolean>(true);
  isLoadingReviews     = signal<boolean>(true);
  selectedImageIndex   = signal<number>(0);

  // ─── Review Form State ────────────────────────────────────────────────────
  showReviewForm       = signal<boolean>(false);
  reviewComment        = signal<string>('');
  reviewRating         = signal<number>(5);
  isSubmittingReview   = signal<boolean>(false);
  reviewSubmitStatus   = signal<number | null>(null);
  reviewSubmitMessage  = signal<string>('');

  // ─── Cart State ───────────────────────────────────────────────────────────
  quantity             = signal<number>(1);
  isAddingToCart       = signal<boolean>(false);
  addToCartStatus      = signal<number | null>(null);
  addToCartMessage     = signal<string>('');

  // ─── Computed ─────────────────────────────────────────────────────────────

  /** მომხმარებელმა უკვე დატოვა რევიუ ამ პროდუქტზე */
  hasUserReviewed = computed(() => {
    const userId = this._modalService.loggedInUserId();
    if (userId === null) return false;
    return this.reviews().some(review => review.userId === userId);
  });

  averageRating = computed(() => {
    const list = this.reviews();
    if (list.length === 0) return 0;
    const sum = list.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / list.length) * 10) / 10;
  });

  ratingDistribution = computed(() => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    this.reviews().forEach(r => {
      const key = r.rating as keyof typeof dist;
      if (dist[key] !== undefined) dist[key]++;
    });
    return dist;
  });

  ratingPercentages = computed(() => {
    const dist  = this.ratingDistribution();
    const total = this.reviews().length;
    const pct   = (n: number) => total === 0 ? 0 : Math.round((n / total) * 100);
    return { 5: pct(dist[5]), 4: pct(dist[4]), 3: pct(dist[3]), 2: pct(dist[2]), 1: pct(dist[1]) };
  });

  getRatingPercentage(rating: number): number {
    const p = this.ratingPercentages();
    return p[rating as keyof typeof p] || 0;
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadProductDetails();
  }

  // ─── Product ──────────────────────────────────────────────────────────────
  private loadProductDetails(): void {
    const productId = this._activatedRoute.snapshot.paramMap.get('productId');
    if (!productId) {
      this._router.navigate(['/']);
      return;
    }

    this._apiService.getProductById(Number(productId)).subscribe({
      next: (response) => {
        this.product.set(response.data);
        this.reviews.set(response.data.reviews || []);
        this.isLoadingProduct.set(false);
        this.isLoadingReviews.set(false);
      },
      error: (error) => {
        console.error('Error loading product:', error);
        this.isLoadingProduct.set(false);
        this.isLoadingReviews.set(false);
      }
    });
  }

  private reloadReviews(productId: number): void {
    this._apiService.getProductById(productId).subscribe({
      next:  (response) => this.reviews.set(response.data.reviews || []),
      error: (error)    => console.error('Error reloading reviews:', error)
    });
  }

  // ─── Reviews ──────────────────────────────────────────────────────────────
  submitReview(): void {
    if (!this._modalService.isUserLoggedIn()) {
      this._modalService.openLogInModal();
      return;
    }

    const product = this.product();
    if (!product || !this.reviewComment().trim()) {
      this.reviewSubmitStatus.set(0);
      this.reviewSubmitMessage.set('Please fill all fields');
      return;
    }

    this.isSubmittingReview.set(true);

    this._apiService.addReview(product.id, this.reviewComment().trim(), this.reviewRating()).subscribe({
      next: (response) => {
        if (response.success) {
          this.reviewSubmitStatus.set(1);
          this.reviewSubmitMessage.set('Review added successfully!');
          this.reviewComment.set('');
          this.reviewRating.set(5);
          this.showReviewForm.set(false);
          this.reloadReviews(product.id);
          setTimeout(() => this.reviewSubmitStatus.set(null), 3000);
        } else {
          this.reviewSubmitStatus.set(0);
          this.reviewSubmitMessage.set(response.message || 'Error adding review');
        }
        this.isSubmittingReview.set(false);
      },
      error: (error) => {
        this.reviewSubmitStatus.set(0);
        this.reviewSubmitMessage.set(
          error.error?.message ?? error.error?.Message ?? 'Error adding review'
        );
        this.isSubmittingReview.set(false);
      }
    });
  }

  deleteReview(reviewId: number): void {
    if (!confirm('Are you sure you want to delete this review?')) return;

    const product = this.product();
    if (!product) return;

    this._apiService.deleteReview(product.id, reviewId).subscribe({
      next: (response) => {
        if (response.success) {
          this.reviewSubmitStatus.set(1);
          this.reviewSubmitMessage.set('Review deleted successfully!');
          this.reloadReviews(product.id);
          setTimeout(() => this.reviewSubmitStatus.set(null), 3000);
        }
      },
      error: (error) => {
        this.reviewSubmitStatus.set(0);
        this.reviewSubmitMessage.set(
          error.error?.message ?? error.error?.Message ?? 'Error deleting review'
        );
      }
    });
  }

  // ─── Cart ─────────────────────────────────────────────────────────────────
  addToCart(): void {
    if (!this._modalService.isUserLoggedIn()) {
      this._modalService.openLogInModal();
      return;
    }

    const product = this.product();
    if (!product) return;

    this.isAddingToCart.set(true);

    this._apiService.addToCart(this._modalService.loggedInUserId()!, product.id, this.quantity()).subscribe({
      next: (response) => {
        this.addToCartStatus.set(response.success ? 1 : 0);
        this.addToCartMessage.set(response.message || 'Product added to cart');
        this.isAddingToCart.set(false);

        if (response.success) {
          this._modalService.cartRefresh$.next();
          this.quantity.set(1);
          setTimeout(() => {
            this.addToCartStatus.set(null);
            this.addToCartMessage.set('');
          }, 3000);
        }
      },
      error: (error) => {
        console.error('Error adding to cart:', error);
        this.addToCartStatus.set(0);
        this.addToCartMessage.set(error.error?.message || 'Error adding to cart');
        this.isAddingToCart.set(false);
      }
    });
  }

  increaseQuantity(): void {
    const product = this.product();
    if (product && this.quantity() < product.stock) {
      this.quantity.update(q => q + 1);
    }
  }

  decreaseQuantity(): void {
    if (this.quantity() > 1) this.quantity.update(q => q - 1);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  selectImage(index: number): void {
    this.selectedImageIndex.set(index);
  }

  getStars(rating: number): string {
    const full = Math.round(rating);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src =
      'https://via.placeholder.com/400x400?text=Product+Image';
  }
}