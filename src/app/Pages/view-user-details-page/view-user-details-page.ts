import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiConnectionService } from '../../Services/api-connection-service';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-view-user-details-page',
  imports: [DecimalPipe, DatePipe, TranslateModule, CommonModule],
  templateUrl: './view-user-details-page.html',
  styleUrl: './view-user-details-page.scss',
})
export class ViewUserDetailsPage implements OnInit {
  private _route  = inject(ActivatedRoute);
  private _router = inject(Router);
  private _http   = inject(ApiConnectionService);

  user      = signal<any>(null);
  isLoading = signal(true);

  // UserRole: 0=USER, 1=ADMIN, 2=MANAGER
  roleLabel = computed(() => {
    const labels: Record<number, string> = { 0: 'User', 1: 'Admin', 2: 'Manager' };
    return labels[this.user()?.role] ?? 'User';
  });

  roleBadgeClass = computed(() => {
    const classes: Record<number, string> = { 0: 'customer', 1: 'admin', 2: 'manager' };
    return classes[this.user()?.role] ?? 'customer';
  });

  purchaseMod = computed(() => (this.user()?.purchaseCount ?? 0) % 10);

  discountProgress = computed(() => (this.purchaseMod() / 10) * 100);

  // OrderStatus: 0=PENDING, 1=PAID, 2=SHIPPED, 3=DELIVERED, 4=CANCELED
  getStatusLabel(status: number): string {
    const labels: Record<number, string> = {
      0: 'Pending',
      1: 'Paid',
      2: 'Shipped',
      3: 'Delivered',
      4: 'Canceled',
    };
    return labels[status] ?? 'Unknown';
  }

  getStatusClass(status: number): string {
    const classes: Record<number, string> = {
      0: 'order-status status-pending',
      1: 'order-status status-paid',
      2: 'order-status status-shipped',
      3: 'order-status status-delivered',
      4: 'order-status status-canceled',
    };
    return classes[status] ?? 'order-status status-pending';
  }

  // PaymentMethod: 0=CARD, 1=CASH, 2=PAYPAL
  getPaymentLabel(method: number): string {
    const labels: Record<number, string> = {
      0: 'Card',
      1: 'Cash',
      2: 'PayPal',
    };
    return labels[method] ?? 'Unknown';
  }

  getPaymentIcon(method: number): string {
    const icons: Record<number, string> = {
      0: 'fa-solid fa-credit-card',
      1: 'fa-solid fa-money-bill-wave',
      2: 'fa-brands fa-paypal',
    };
    return icons[method] ?? 'fa-solid fa-circle-question';
  }

  ngOnInit(): void {
    const idParam = this._route.snapshot.paramMap.get('id');
    const id = idParam ? +idParam : null;

    if (!id) {
      this._router.navigate(['/manage-users']);
      return;
    }

    this._http.getUserById(id).subscribe({
      next: (u) => {
        this.user.set(u.data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('getUserById error:', err);
        this.isLoading.set(false);
      }
    });
  }

  goBack(): void { this._router.navigate(['/manage-users']); }
}