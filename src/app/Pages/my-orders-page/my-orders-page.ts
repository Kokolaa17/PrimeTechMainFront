import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiConnectionService } from '../../Services/api-connection-service';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';


@Component({
  selector: 'app-my-orders-page',
  imports: [DecimalPipe, DatePipe, NgClass],
  templateUrl: './my-orders-page.html',
  styleUrl: './my-orders-page.scss',
})
export class MyOrdersPage {
  private _route  = inject(ActivatedRoute);
  private _router = inject(Router);
  private _http   = inject(ApiConnectionService);
 
  user      = signal<any>(null);
  isLoading = signal(true);
 
  orders = computed(() => this.user()?.orders ?? []);
 
  totalSpent = computed(() =>
    this.orders().reduce((sum: number, o: any) => sum + (o.totalAmount ?? 0), 0)
  );
 
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
      0: 'status-pending',
      1: 'status-paid',
      2: 'status-shipped',
      3: 'status-delivered',
      4: 'status-canceled',
    };
    return classes[status] ?? 'status-pending';
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
    const idParam = this._route.snapshot.paramMap.get('userId');
    const id = idParam ? +idParam : null;
 
    if (!id) {
      this._router.navigate(['/']);
      return;
    }
 
    this._http.getUserById(id).subscribe({
      next: (res) => {
        this.user.set(res.data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('getUserById error:', err);
        this.isLoading.set(false);
      },
    });
  }
}
