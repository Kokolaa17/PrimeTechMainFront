import { Component, computed, inject, signal } from '@angular/core';
import { ApiConnectionService } from '../../Services/api-connection-service';
import { DecimalPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

interface TopProductDto {
  id: number;
  name: string;
  salesCount: number;
  totalRevenue: number;
  price: number;
}
 
interface TopCustomerDto {
  id: number;
  fullName: string;
  email: string;
  totalSpent: number;
  purchaseCount: number;
}
 
interface DailyRevenueDto {
  date: string;
  revenue: number;
  orders: number;
}
 
interface LowStockDto {
  id: number;
  name: string;
  stock: number;
}
 
interface AnalyticsDto {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProductsSold: number;
  averageOrderValue: number;
 
  pendingOrders: number;
  paidOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  canceledOrders: number;
 
  topProductsBySales: TopProductDto[];
  topProductsByRevenue: TopProductDto[];
 
  topCustomersBySpend: TopCustomerDto[];
  topCustomersByPurchases: TopCustomerDto[];
 
  dailyRevenue: DailyRevenueDto[];
 
  cardOrders: number;
  cashOrders: number;
  paypalOrders: number;
 
  lowStockProducts: LowStockDto[];
}

@Component({
  selector: 'app-analytics-page',
  imports: [DecimalPipe, TranslateModule],
  templateUrl: './analytics-page.html',
  styleUrl: './analytics-page.scss',
})
export class AnalyticsPage {
   private _http = inject(ApiConnectionService);
 
  data      = signal<AnalyticsDto | null>(null);
  isLoading = signal(true);
 
  // ── Computed ─────────────────────────────────────────────────
 
  maxDailyRevenue = computed(() => {
    const d = this.data();
    if (!d) return 1;
    return Math.max(...d.dailyRevenue.map(r => r.revenue), 1);
  });
 
  orderStatusSegments = computed(() => {
    const d = this.data();
    if (!d) return [];
 
    const segments = [
      { label: 'Pending',   count: d.pendingOrders,   color: '#f9a825' },
      { label: 'Paid',      count: d.paidOrders,      color: '#2e7d32' },
      { label: 'Shipped',   count: d.shippedOrders,   color: '#1565c0' },
      { label: 'Delivered', count: d.deliveredOrders, color: '#ec5e2a' },
      { label: 'Canceled',  count: d.canceledOrders,  color: '#c62828' },
    ];
 
    const total       = d.totalOrders || 1;
    const circumference = 2 * Math.PI * 45; // r=45
    let cumulativePct = 0;
 
    return segments.map(seg => {
      const pct    = seg.count / total;
      const dash   = `${pct * circumference} ${circumference}`;
      // rotate so each segment starts where the previous ended
      // SVG circle starts at 3 o'clock → subtract 25% to start at 12
      const offset = circumference * (0.25 - cumulativePct);
      cumulativePct += pct;
      return { ...seg, dash, offset };
    });
  });
 
  // ── Lifecycle ─────────────────────────────────────────────────
 
  ngOnInit(): void {
    this._http.getAnalytics().subscribe({
      next: (res: any) => {
        this.data.set(res.data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Analytics error:', err);
        this.isLoading.set(false);
      },
    });
  }
 
  // ── Chart helpers ─────────────────────────────────────────────
 
  getBarHeight(revenue: number): number {
    const max = this.maxDailyRevenue();
    return max === 0 ? 0 : (revenue / max) * 100;
  }
 
  isWeekMark(index: number): boolean {
    return index % 7 === 0;
  }
 
  getHBarWidth(value: number, list: any[], key: string): number {
    const max = Math.max(...list.map(i => i[key]), 1);
    return (value / max) * 100;
  }
 
  getPaymentPct(type: 'card' | 'cash' | 'paypal'): number {
    const d = this.data();
    if (!d) return 0;
    const total = d.cardOrders + d.cashOrders + d.paypalOrders || 1;
    const val   = type === 'card' ? d.cardOrders
                : type === 'cash' ? d.cashOrders
                : d.paypalOrders;
    return (val / total) * 100;
  }
}
