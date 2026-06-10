import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { ApiConnectionService } from '../../Services/api-connection-service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-manage-orders-page',
  imports: [CommonModule, DatePipe, DecimalPipe, TranslateModule],
  templateUrl: './manage-orders-page.html',
  styleUrl: './manage-orders-page.scss',
})
export class ManageOrdersPage implements OnInit {
  private _http = inject(ApiConnectionService);

  orders     = signal<any[]>([]);
  isLoading  = signal(true);
  totalCount = signal(0);
  activeFilter = signal<number | null>(null);
  expandedId   = signal<number | null>(null);

  // OrderStatus: 0=PENDING, 1=PAID, 2=SHIPPED, 3=DELIVERED, 4=CANCELED
  statusList = [
    { value: 0, label: 'Pending',   dotClass: 'dot-pending'   },
    { value: 1, label: 'Paid',      dotClass: 'dot-paid'      },
    { value: 2, label: 'Shipped',   dotClass: 'dot-shipped'   },
    { value: 3, label: 'Delivered', dotClass: 'dot-delivered' },
    { value: 4, label: 'Canceled',  dotClass: 'dot-canceled'  },
  ];

  ngOnInit(): void {
    this.loadAll();
  }

  // ── Loaders ──────────────────────────────────────────────────

  loadAll(): void {
    this.isLoading.set(true);
    this._http.getAllOrders().subscribe({
      next: (res: any) => {
        this.orders.set(res.data.items);
        this.totalCount.set(res.data.totalCount);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  loadByStatus(status: number): void {
    this.isLoading.set(true);
    this._http.getOrdersByStatus(status).subscribe({
      next: (res: any) => {
        this.orders.set(res.data ?? []);
        this.totalCount.set(res.data?.length ?? 0);
        this.isLoading.set(false);
      },
      error: () => {
        this.orders.set([]);      // ← ეს აკლდა
        this.totalCount.set(0);   // ← ეს აკლდა
        this.isLoading.set(false);
      },
    });
  }

  setFilter(status: number | null): void {
    this.activeFilter.set(status);
    status === null ? this.loadAll() : this.loadByStatus(status);
  }

  // ── Status actions ────────────────────────────────────────────

  markAsPaid(id: number): void {
    this._http.markOrderAsPaid(id).subscribe({
      next: () => this.refreshCurrent(),
      error: (err) => console.error('Pay error:', err),
    });
  }

  markAsShipped(id: number): void {
    this._http.markOrderAsShipped(id).subscribe({
      next: () => this.refreshCurrent(),
      error: (err) => console.error('Ship error:', err),
    });
  }

  markAsDelivered(id: number): void {
    this._http.markOrderAsDelivered(id).subscribe({
      next: () => this.refreshCurrent(),
      error: (err) => console.error('Deliver error:', err),
    });
  }

  cancelOrder(id: number): void {
    if (!confirm(`Cancel order #${id}?`)) return;
    this._http.cancelOrder(id).subscribe({
      next: () => this.refreshCurrent(),
      error: (err) => console.error('Cancel error:', err),
    });
  }

  private refreshCurrent(): void {
    const f = this.activeFilter();
    f === null ? this.loadAll() : this.loadByStatus(f);
  }

  // ── Display helpers ───────────────────────────────────────────

  getStatusLabel(status: number): string {
    const map: Record<number, string> = {
      0: 'Pending', 1: 'Paid', 2: 'Shipped', 3: 'Delivered', 4: 'Canceled',
    };
    return map[status] ?? 'Unknown';
  }

  getStatusClass(status: number): string {
    const map: Record<number, string> = {
      0: 'status-pending',
      1: 'status-paid',
      2: 'status-shipped',
      3: 'status-delivered',
      4: 'status-canceled',
    };
    return map[status] ?? '';
  }

  getPaymentLabel(method: number): string {
    const map: Record<number, string> = { 0: 'Card', 1: 'Cash', 2: 'PayPal' };
    return map[method] ?? 'Unknown';
  }

  getPaymentIcon(method: number): string {
    const map: Record<number, string> = {
      0: 'fa-solid fa-credit-card',
      1: 'fa-solid fa-money-bill-wave',
      2: 'fa-brands fa-paypal',
    };
    return map[method] ?? 'fa-solid fa-circle-question';
  }

  getPaymentClass(method: number): string {
    const map: Record<number, string> = {
      0: 'pay-card', 1: 'pay-cash', 2: 'pay-paypal',
    };
    return map[method] ?? '';
  }
}