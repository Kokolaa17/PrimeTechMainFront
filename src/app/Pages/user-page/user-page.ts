import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CurrencyPipe, DecimalPipe, DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { CookieService } from 'ngx-cookie-service';

import { UpdateUserInterface } from '../../Interfaces/update-user-interface';
import { ModalService } from '../../Services/modal-service';
import { ApiConnectionService } from '../../Services/api-connection-service';

@Component({
  selector: 'app-user-page',
  imports: [RouterModule, TranslateModule, ReactiveFormsModule, DatePipe],
  templateUrl: './user-page.html',
  styleUrl: './user-page.scss',
})
export class UserPage implements OnInit {
  // ── Services ──────────────────────────────────────────────────
  private readonly _router = inject(Router);
  private readonly _activatedR = inject(ActivatedRoute);
  private readonly _modalService = inject(ModalService);
  private readonly _cookieService = inject(CookieService);
  private readonly _http = inject(ApiConnectionService);

  // ── Streams & Data Signals ────────────────────────────────────
  public allOrders = toSignal(
    this._http.getAllUsers().pipe(map((res) => res.data))
  );

  public allProducts = toSignal(
    this._http.getAllProducts().pipe(map((res: any) => res.data.data)), 
    { initialValue: [] }
  );

  public userProfile = signal<any | null>(null);
  public pendingOrders = signal<any[]>([]);
  public paidOrders = signal<any[]>([]);
  public shippedOrders = signal<any[]>([]);

  // ── Computed Properties ───────────────────────────────────────
  public lowStockProducts = computed(() =>
    this.allProducts().filter((product: any) => product.stock <= 10)
  );

  public isEditUserModalOpen = computed(() => this._modalService.isEditUserModalOpen());
  public isDepositModalOpen = computed(() => this._modalService.isDepositModalOpen());

  // ── UI UI State Signals ────────────────────────────────────────
  public modalAvatarPreview = signal<string | null>(null);
  public saveStatus = signal<boolean | null>(null);
  public saveMessage = signal('');
  
  public depositAmount = signal<number | null>(null);
  public isDepositing = signal(false);
  public depositStatus = signal<boolean | null>(null);

  // ── Static Settings ───────────────────────────────────────────
  public readonly quickAmounts = [10, 25, 50, 100, 250, 500];

  // ── Forms ─────────────────────────────────────────────────────
  public editForm = new FormGroup({
    firstName: new FormControl('', Validators.required),
    lastName: new FormControl('', Validators.required),
    avatarUrl: new FormControl<string | null>(null),
  });

  // ── Lifecycle Hooks ───────────────────────────────────────────
  public ngOnInit(): void {
    this.getUserInfo();
    this.getPendingOrders();
    this.getPaiedOrders();
    this.getShippedOrders();
  }

  // ── Component Logic ───────────────────────────────────────────
  public getUserInfo(): void {
    const resolvedResult = this._activatedR.snapshot.data['userData'];

    if (resolvedResult && resolvedResult.success) {
      this.userProfile.set(resolvedResult.data);
    }
  }

  public refreshUserInfo(): void {
    this._http.getUserInfo(this.userProfile()?.id).subscribe({
      next: (res) => {
        this.userProfile.set(res.data);
      }
    });
  }

  public logOut(): void {
    this._cookieService.delete('token');
    localStorage.removeItem('user');
    this._router.navigate(['/']);
    this._modalService.logout();
  }

  // ── Edit Profile Modal Handlers ────────────────────────────────
  public openEditModal(): void {
    const u = this.userProfile();
    this.editForm.patchValue({
      firstName: u?.firstName ?? u?.name ?? '',
      lastName: u?.lastName ?? u?.surname ?? '',
      avatarUrl: u?.avatarUrl ?? '',
    });
    this.modalAvatarPreview.set(u?.avatarUrl ?? null);
    this.saveStatus.set(null);
    this._modalService.openEditUserModal();
  }

  public closeEditModal(): void {
    this._modalService.closeEditUserModal();
    this.editForm.reset();
    this.modalAvatarPreview.set(null);
  }

  public onBackdropClick(event: MouseEvent): void {
    this.closeEditModal();
  }

  public onModalSubmit(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const userId = this.userProfile()?.id;
    if (!userId) return;

    const { firstName, lastName, avatarUrl } = this.editForm.value;

    const payload: UpdateUserInterface = {
      id: userId,
      firstName: firstName ?? null,
      lastName: lastName ?? null,
      email: null,
      avatarUrl: avatarUrl ?? null,
      role: null,
    };

    this._http.updateUser(userId, payload).subscribe({
      next: (res) => {
        this.saveStatus.set(true);
        this.userProfile.update((u: any) => ({ ...u, ...res.data }));
        
        setTimeout(() => {
          this.closeEditModal();
          this.saveStatus.set(null);
          this.refreshUserInfo();
        }, 1500);
      },
      error: () => {
        this.saveStatus.set(false);
        setTimeout(() => this.saveStatus.set(null), 3000);
      },
    });
  }

  // ── Deposit Modal Handlers ────────────────────────────────────
  public openDepositModal(): void {
    this.depositAmount.set(null);
    this.depositStatus.set(null);
    this._modalService.openDepositModal();
  }

  public closeDepositModal(): void {
    this._modalService.closeDepositModal();
    this.depositAmount.set(null);
    this.depositStatus.set(null);
  }

  public setDepositAmount(amt: number): void {
    this.depositAmount.set(amt);
  }

  public onDepositInput(event: Event): void {
    const val = parseFloat((event.target as HTMLInputElement).value);
    this.depositAmount.set(isNaN(val) ? null : val);
  }

  public onDepositSubmit(): void {
    const amount = this.depositAmount();
    if (!amount || amount <= 0) return;

    this.isDepositing.set(true);

    this._http.depositFunds(this.userProfile()?.id, amount).subscribe({
      next: () => {
        this.depositStatus.set(true);
        this.isDepositing.set(false);
        this.userProfile.update((u: any) => ({
          ...u,
          balance: (u?.balance ?? 0) + amount,
        }));
        
        setTimeout(() => {
          this.closeDepositModal();
          this.refreshUserInfo();
        }, 1500);
      },
      error: () => {
        this.depositStatus.set(false);
        this.isDepositing.set(false);
        setTimeout(() => this.depositStatus.set(null), 3000);
      },
    });
  }

  // ── Orders ────────────────────────────────────────────────────
  public getPendingOrders(): void {
    this._http.getOrdersByStatus(0).subscribe({
      next: (res: any) => {
        this.pendingOrders.set(res.data);
      }
    });
  }

   public getPaiedOrders(): void {
    this._http.getOrdersByStatus(1).subscribe({
      next: (res: any) => {
        this.paidOrders.set(res.data);
      }
    });
  }

   public getShippedOrders(): void {
    this._http.getOrdersByStatus(2).subscribe({
      next: (res: any) => {
        this.shippedOrders.set(res.data);
      }
    });
  }
}