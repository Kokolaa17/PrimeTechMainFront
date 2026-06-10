import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { jwtDecode } from 'jwt-decode';
import { ModalService } from '../../Services/modal-service';
import { ApiConnectionService } from '../../Services/api-connection-service';
import { TranslateModule } from '@ngx-translate/core';
import { forkJoin, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cart-modal',
  imports: [TranslateModule, CommonModule, FormsModule],
  templateUrl: './cart-modal.html',
  styleUrl: './cart-modal.scss',
  standalone: true,
})
export class CartModal implements OnInit, OnDestroy {
  private readonly _http = inject(ApiConnectionService);
  private readonly _cookieService = inject(CookieService);
  private readonly _modalService = inject(ModalService);

  private cartSub!: Subscription;

  // ─── Cart state ───────────────────────────────────────────────────────────
  loggedInUserId = signal<number | null>(null);
  productsInCart = signal<any[]>([]);
  totalItems = signal<number>(0);
  totalAmount = signal<number>(0);

  // ─── Checkout step state ──────────────────────────────────────────────────
  step = signal<'cart' | 'checkout'>('cart');
  addresses = signal<any[]>([]);
  selectedAddressId = signal<number | null>(null);
  selectedPaymentMethod = signal<number>(0); // 0 = CASH, 1 = BALANCE
  userBalance = signal<number>(0);
  balanceInsufficient = signal<boolean>(false);

  // ─── Feedback ─────────────────────────────────────────────────────────────
  checkoutStatus = signal<number | null>(null);
  checkoutMessage = signal<string>('');
  isPlacingOrder = signal<boolean>(false);

  readonly PAYMENT_BALANCE = 0;
  readonly PAYMENT_CASH = 1;

  ngOnInit(): void {
    this.getUser();
    this.loadCart();
    this.cartSub = this._modalService.cartRefresh$.subscribe(() => this.loadCart());
  }

  getUser() {
    if (this._cookieService.check('token')) {
      const token = this._cookieService.get('token');
      const decoded: any = jwtDecode(token);
      this.loggedInUserId.set(Number(decoded.nameid));
    }
  }

  loadCart() {
    const userId = this._modalService.loggedInUserId();
    if (!userId) return;

    this._http.getCart(userId).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.productsInCart.set(res.data.items);
          this.totalItems.set(res.data.totalItems);
          this.totalAmount.set(res.data.totalAmount);
          this._modalService.totalCartItems.set(res.data.totalItems);
        }
      }
    });
  }

  // ─── Go to checkout step ──────────────────────────────────────────────────
  goToCheckout() {
    const userId = this._modalService.loggedInUserId();
    if (!userId) return;

    forkJoin({
      addresses: this._http.getShippingAddresses(userId),
      profile: this._http.getUserById(userId)
    }).subscribe({
      next: ({ addresses, profile }: any) => {
        if (addresses.success) {
          this.addresses.set(addresses.data ?? []);
          if (addresses.data?.length > 0)
            this.selectedAddressId.set(addresses.data[0].id);
        }
        if (profile.success) {
          this.userBalance.set(profile.data.balance ?? 0);
        }
        this.checkBalanceSufficiency();
        this.step.set('checkout');
      }
    });
  }

  backToCart() {
    this.step.set('cart');
    this.balanceInsufficient.set(false);
  }

  onPaymentMethodChange(method: number) {
    this.selectedPaymentMethod.set(method);
    this.checkBalanceSufficiency();
  }

  checkBalanceSufficiency() {
    if (this.selectedPaymentMethod() === this.PAYMENT_BALANCE) {
      this.balanceInsufficient.set(this.userBalance() < this.totalAmount());
    } else {
      this.balanceInsufficient.set(false);
    }
  }

  placeOrder() {
    const userId = this._modalService.loggedInUserId();
    if (!userId || !this.selectedAddressId()) return;
    if (this.balanceInsufficient()) return;
    console.log(this.selectedAddressId())

    this.isPlacingOrder.set(true);

    this._http.checkoutCart(userId, this.selectedAddressId()!, this.selectedPaymentMethod()).subscribe({
      next: (res: any) => {
        this.isPlacingOrder.set(false);
        this.checkoutStatus.set(200);
        this.checkoutMessage.set(res.message ?? 'Order placed successfully!');
        this.productsInCart.set([]);
        this.totalItems.set(0);
        this.totalAmount.set(0);
        this._modalService.totalCartItems.set(0);
        this.step.set('cart');
        setTimeout(() => {
          this.checkoutStatus.set(null)
          this._modalService.closeCartModal()
        }, 3000);
      },
      error: (err) => {
        this.isPlacingOrder.set(false);
        this.checkoutStatus.set(400);
        this.checkoutMessage.set(err.error?.message ?? 'Checkout failed.');
        setTimeout(() => this.checkoutStatus.set(null), 3000);
      }
    });
  }

  // ─── Cart actions ─────────────────────────────────────────────────────────
  increaseQty(item: any) {
    const userId = this._modalService.loggedInUserId();
    this._http.updateCartItem(userId!, item.cartItemId, item.quantity + 1).subscribe({
      next: (res: any) => { if (res.success) this.loadCart(); }
    });
  }

  decreaseQty(item: any) {
    const userId = this._modalService.loggedInUserId();
    if (item.quantity <= 1) return;
    this._http.updateCartItem(userId!, item.cartItemId, item.quantity - 1).subscribe({
      next: (res: any) => { if (res.success) this.loadCart(); }
    });
  }

  removeFromCart(cartItemId: number) {
    const userId = this._modalService.loggedInUserId();
    if (!userId) return;
    this._http.removeFromCart(userId, cartItemId).subscribe({
      next: (res: any) => { if (res.success) this.loadCart(); }
    });
  }

  clearCart() {
    const userId = this._modalService.loggedInUserId();
    if (!userId) return;
    this._http.clearCart(userId).subscribe({
      next: (res: any) => {
        if (res.success) {
          this._modalService.triggerCartRefresh();
          this.productsInCart.set([]);
          this.totalItems.set(0);
          this.totalAmount.set(0);
        }
      }
    });
  }

  closeCart() {
    this._modalService.closeCartModal();
  }

  ngOnDestroy(): void {
    if (this.cartSub) this.cartSub.unsubscribe();
  }
}