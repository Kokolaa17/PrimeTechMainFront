import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { ApiConnectionService } from '../../Services/api-connection-service';
import { ModalService } from '../../Services/modal-service';


export interface ProductFilters {
  search?: string;
  categoryId?: number;
  brandId?: number;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  minRating?: number;
  sortBy?: number;
  page?: number;
  pageSize?: number;
}

export const SORT_OPTIONS = [
  { label: 'Default',         value: 0 },
  { label: 'Price: Low → High', value: 1 },
  { label: 'Price: High → Low', value: 2 },
  { label: 'Newest First',    value: 3 },
  { label: 'Top Rated',       value: 4 },
  { label: 'Most Popular',    value: 5 },
];

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe],
  templateUrl: './shop-page.html',
  styleUrl: './shop-page.scss',
})
export class shopPage implements OnInit, OnDestroy {
  private readonly _http    = inject(ApiConnectionService);
  private readonly _modal   = inject(ModalService);
  private readonly _router  = inject(Router);
  private readonly _route   = inject(ActivatedRoute);
  private readonly _destroy$ = new Subject<void>();
  private readonly _search$  = new Subject<string>();


  // ── state ──────────────────────────────────────────────────────────────────
  products    = signal<any[]>([]);
  categories  = signal<any[]>([]);
  brands      = signal<any[]>([]);
  loading     = signal(false);
  totalCount  = signal(0);

  addToCartErrors  = signal<Map<number, string>>(new Map());
  addToCartSuccess = signal<Map<number, string>>(new Map());

  openSections = signal<Record<string, boolean>>({
    sort: true, category: true, brand: false,
    price: false, rating: false, toggles: true,
  });

  readonly sortOptions = SORT_OPTIONS;
  readonly pageSizes   = [12, 24, 48];
  readonly ratingOptions = [1, 2, 3, 4];

  // ── filter model ───────────────────────────────────────────────────────────
  filters: ProductFilters = {
    page: 1,
    pageSize: 24,
    sortBy: 0,
  };

  searchInput = '';

  totalPages = computed(() => Math.ceil(this.totalCount() / (this.filters.pageSize ?? 24)));
  pageNumbers = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

  // ── lifecycle ──────────────────────────────────────────────────────────────
    ngOnInit(): void {
    // Read ?search= query param coming from the navbar
    this._route.queryParams
      .pipe(takeUntil(this._destroy$))
      .subscribe(params => {
        if (params['search']) {
          this.filters.search = params['search'];
          // Open the sort section so the user sees the active search
        }
        this.loadMetadata()
        this.loadProducts();
      });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  // ── data ───────────────────────────────────────────────────────────────────
  private loadMetadata(): void {
    this._http.getAllCategories?.().subscribe((res: any) => this.categories.set(res?.data ?? res ?? []));
    this._http.getAllBrands?.().subscribe((res: any) => this.brands.set(res?.data ?? res ?? []));
  }

  loadProducts(): void {
    this.loading.set(true);
    this._http.getAllProducts(this.filters).subscribe({
      next: (res: any) => {
        this.products.set(res?.data.data ??[]);
        this.totalCount.set(res?.data.totalCount ?? this.products().length);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // ── filter helpers ─────────────────────────────────────────────────────────
  onSearchChange(val: string): void { this._search$.next(val); }

  onFilterChange(): void {
    this.filters.page = 1;
    this.loadProducts();
  }

  toggleSection(key: string): void {
    this.openSections.update(s => ({ ...s, [key]: !s[key] }));
  }

  setCategory(id: number | undefined): void {
    this.filters.categoryId = id;
    this.onFilterChange();
  }

  setBrand(id: number | undefined): void {
    this.filters.brandId = id;
    this.onFilterChange();
  }

  setRating(val: number | undefined): void {
    this.filters.minRating = val;
    this.onFilterChange();
  }

  setSort(val: number): void {
    this.filters.sortBy = val;
    this.loadProducts();
  }

  setPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.filters.page = page;
    this.loadProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  clearFilters(): void {
    this.searchInput = '';
    this.filters = { page: 1, pageSize: this.filters.pageSize, sortBy: 0 };
    this.loadProducts();
  }

  // ── product helpers ────────────────────────────────────────────────────────
  effectivePrice(p: any): number { return p.discountPrice > 0 ? p.discountPrice : p.price; }

  getDiscountPercent(p: any): number {
    const old = p.oldPrice ?? p.price;
    const cur = p.discountPrice > 0 ? p.discountPrice : p.price;
    if (!old || old <= cur) return 0;
    return Math.round(((old - cur) / old) * 100);
  }

  getStars(rating: number): string {
    const full = Math.round(rating ?? 0);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }

  isNew(createdAt: any): boolean {
    const days = (Date.now() - new Date(createdAt).getTime()) / 86_400_000;
    return days < 7;
  }

  goToDetails(id: number): void { this._router.navigate(['/product', id]); }

  addToCart(productId: number): void {
    const userId = this._modal.loggedInUserId();
    if (!userId) { this._modal.openLogInModal(); return; }

    this._http.addToCart(userId, productId).subscribe({
      next: (res: any) => {
        if (res.success) {
          this._modal.openCartModal();
          this._modal.triggerCartRefresh();
          this.addToCartSuccess.update(m => new Map(m).set(productId, 'added'));
          setTimeout(() => {
            this.addToCartSuccess.update(m => { const n = new Map(m); n.delete(productId); return n; });
          }, 2000);
        } else {
          this.addToCartErrors.update(m => new Map(m).set(productId, res.message ?? 'Failed'));
        }
      },
      error: (err) => {
        this.addToCartErrors.update(m => new Map(m).set(productId, err.error?.message ?? 'Error'));
      },
    });
  }
}