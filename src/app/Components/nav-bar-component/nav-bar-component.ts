import {
  Component,
  computed,
  effect,
  inject,
  OnInit,
  OnDestroy,
  signal,
  ViewChild,
  ElementRef,
  HostListener,
} from "@angular/core";
import { CommonModule, DecimalPipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ModalService } from "../../Services/modal-service";
import { Router, RouterLink } from "@angular/router";
import { LogInModal } from "../../Modals/log-in-modal/log-in-modal";
import { VerifyUserModal } from "../../Modals/verify-user-modal/verify-user-modal";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { CookieService } from "ngx-cookie-service";
import { jwtDecode } from "jwt-decode";
import { ApiConnectionService } from "../../Services/api-connection-service";
import { SideMenuModal } from "../../Modals/side-menu-modal/side-menu-modal";
import { CartModal } from "../../Modals/cart-modal/cart-modal";
import { Subject, Subscription } from "rxjs";
import { debounceTime, distinctUntilChanged, switchMap, takeUntil } from "rxjs/operators";

@Component({
  selector: "app-nav-bar-component",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DecimalPipe,
    LogInModal,
    RouterLink,
    VerifyUserModal,
    TranslateModule,
    SideMenuModal,
    CartModal,
  ],
  templateUrl: "./nav-bar-component.html",
  styleUrl: "./nav-bar-component.scss",
})
export class NavBarComponent implements OnInit, OnDestroy {

  @ViewChild("searchInput") searchInputRef!: ElementRef<HTMLInputElement>;

  private readonly translate            = inject(TranslateService);
  private readonly _modalService        = inject(ModalService);
  private readonly _router              = inject(Router);
  private readonly _cookieService       = inject(CookieService);
  private readonly _apiConnectionService = inject(ApiConnectionService);

  private readonly destroy$   = new Subject<void>();
  private readonly search$    = new Subject<string>();
  private cartSub!: Subscription;

  // ── Search state ────────────────────────────────────────────────────────────
  searchQuery   = "";
  searchResult  = signal<any[]>([]);
  searchLoading = signal(false);
  isDropdownOpen = signal(false);

  // ── User / modal state ──────────────────────────────────────────────────────
  userName    = signal<string | null>(null);
  userId      = signal<string | null>(null);
  userRole    = signal<number | null>(null);
  totalItems  = this._modalService.totalCartItems;

  isSideMenuModalOpen  = computed(() => this._modalService.isSideMenuModalOpen());
  isLogInModalOpen     = computed(() => this._modalService.isLogInModalOpen());
  isVerifyUserModalOpen = computed(() => this._modalService.isVerifyUserModalOpen());
  isUserLoggedIn       = computed(() => this._modalService.isUserLoggedIn());
  isCartModalOpen      = computed(() => this._modalService.isCartModalOpen());

  addToCartErrors = signal<Map<number, string>>(new Map());
  addToCartSuccess = signal<Map<number, string>>(new Map());

  constructor() {
    // Re-fetch user info whenever login state changes
    effect(() => {
      if (this.isUserLoggedIn()) {
        try {
          const token = this._cookieService.get("token");
          if (token) {
            const decoded: any = jwtDecode(token);
            const uid = decoded[
              "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
            ];
            this.getUserInfo(uid);
          }
        } catch (e) {
          console.error("Token decode error:", e);
        }
      } else {
        this.clearLocalSignals();
      }
    });
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    if (!this.translate.currentLang) {
      this.translate.use("en");
    }

    this._modalService.updateGlobalCartCount();
    this.cartSub = this._modalService.cartRefresh$.subscribe(() => {
      this._modalService.updateGlobalCartCount();
    });

    // Debounced search pipeline
    this.search$
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        switchMap((query) => {
          if (!query.trim()) {
            this.searchResult.set([]);
            this.searchLoading.set(false);
            return [];
          }
          this.searchLoading.set(true);
          return this._apiConnectionService.getAllProducts({ search: query, pageSize: 6 });
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res: any) => {
          this.searchResult.set(res?.data?.data ?? res?.data ?? []);
          this.searchLoading.set(false);
          this.isDropdownOpen.set(true);
        },
        error: () => {
          this.searchLoading.set(false);
          this.searchResult.set([]);
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.cartSub?.unsubscribe();
  }

  // ── Search handlers ──────────────────────────────────────────────────────────

  /** Called on every keystroke — feeds the debounce pipeline. */
  onSearchInput(): void {
    if (!this.searchQuery.trim()) {
      this.searchResult.set([]);
      this.isDropdownOpen.set(false);
      this.searchLoading.set(false);
      return;
    }
    this.isDropdownOpen.set(true);
    this.search$.next(this.searchQuery);
  }

  /** Open dropdown again when user clicks back into the input. */
  onSearchFocus(): void {
    if (this.searchQuery && this.searchResult().length > 0) {
      this.isDropdownOpen.set(true);
    }
  }

  /** Clear input and results. */
  clearSearch(): void {
    this.searchQuery = "";
    this.searchResult.set([]);
    this.isDropdownOpen.set(false);
    this.searchInputRef?.nativeElement.focus();
  }

  /** Close dropdown (called by clickOutside or Escape). */
  closeDropdown(): void {
    this.isDropdownOpen.set(false);
  }

  /** Navigate to shop page and apply search filter. */
  goToShopWithSearch(): void {
    if (!this.searchQuery.trim()) return;
    this.closeDropdown();
    this._router.navigate(["/shop-page"], {
      queryParams: { search: this.searchQuery.trim() },
    });
  }

  /** Navigate to product detail page. */
  goToDetails(productId: number) {
    this.closeDropdown()
    this._router.navigate(['/product', productId]);
  }

  /** Add to cart from the search dropdown. */
 addToCart(productId: number) {
  this.closeDropdown()
    const userId = this._modalService.loggedInUserId();
    if (!userId) {
      this._modalService.openLogInModal();
      return;
    }

    this._apiConnectionService.addToCart(userId, productId).subscribe({
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

  /** Close dropdown when pressing Escape. */
  @HostListener("document:keydown.escape")
  onEscape(): void {
    this.closeDropdown();
  }

  // ── User / nav ────────────────────────────────────────────────────────────────
  get currentLanguage(): string {
    return this.translate.currentLang || "en";
  }

  switchLanguage(lang: string): void {
    this.translate.use(lang);
  }

  openLogIn(): void {
    this._router.navigate(["/"]);
    this._modalService.openLogInModal();
  }

  getUserInfo(userId: string): void {
    this._apiConnectionService.getUserInfo(userId).subscribe({
      next: (response) => {
        this.userName.set(response.data.name);
        this.userId.set(userId);
        this.userRole.set(response.data.role);
        localStorage.setItem("user", JSON.stringify(response.data));
        if (response.data.role === 1) {
          this._router.navigate(["/user", this.userId()]);
        }
      },
      error: (e) => console.error("getUserInfo error:", e),
    });
  }

  private clearLocalSignals(): void {
    this.userName.set(null);
    this.userId.set(null);
    this.userRole.set(null);
  }

  openUserPage(): void {
    this._router.navigate(["/user", this.userId()]);
  }

  toggleSideMenuModal(): void {
    this.isSideMenuModalOpen()
      ? this._modalService.closeSideMenuModal()
      : this._modalService.openSideMenuModal();
  }

  toggleCartModal(): void {
    this.isCartModalOpen()
      ? this._modalService.closeCartModal()
      : this._modalService.openCartModal();
  }
}