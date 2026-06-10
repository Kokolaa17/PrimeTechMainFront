import { Component, inject, signal, OnInit } from '@angular/core';
import { ApiConnectionService } from '../../Services/api-connection-service';
import { CookieService } from 'ngx-cookie-service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { jwtDecode } from 'jwt-decode';
import { ModalService } from '../../Services/modal-service';

@Component({
  selector: 'app-add-shipping-address-page',
  imports: [ReactiveFormsModule],
  templateUrl: './add-shipping-address-page.html',
  styleUrl: './add-shipping-address-page.scss',
})
export class AddShippingAddressPage implements OnInit {
  private readonly _http = inject(ApiConnectionService);
  private readonly _cookieService = inject(CookieService);
  private readonly _fb = inject(FormBuilder);
  private readonly _modalService = inject(ModalService)
 
  addresses = signal<any[]>([]);
  addStatus = signal<boolean | null>(null);
  addMessage = signal<string>('');
 
  addressForm!: FormGroup;
 
  ngOnInit(): void {
    this.initForm();
    
    if (this._modalService.loggedInUserId()) {
      this.loadAddresses();
    }
  }

  private initForm(): void {
    this.addressForm = this._fb.group({
      street:  ['', [Validators.required, Validators.maxLength(200)]],
      city:    ['', [Validators.required, Validators.maxLength(100)]],
      country: ['', [Validators.required, Validators.maxLength(100)]],
      zipCode: ['', [Validators.required, Validators.maxLength(20)]],
    });
  }
 
  loadAddresses() {
    const userId = this._modalService.loggedInUserId();
    if (!userId) return;
 
    this._http.getShippingAddresses(userId).subscribe({
      next: (res: any) => {
        if (res.success) this.addresses.set(res.data ?? []);
      }
    });
  }
 
  onSubmit() {
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }
 
    const userId = this._modalService.loggedInUserId();
    if (!userId) {
      this.addStatus.set(false);
      this.addMessage.set('User authentication expired. Please sign in again.');
      return;
    }
 
    const payload = { 
      userId, 
      ...this.addressForm.value 
    };
 
    this._http.addShippingAddress(payload).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.addStatus.set(true);
          this.addressForm.reset();
          this.loadAddresses(); 
          setTimeout(() => this.addStatus.set(null), 3000);
        } else {
          this.addStatus.set(false);
          this.addMessage.set(res.message ?? 'Failed to add address.');
          setTimeout(() => this.addStatus.set(null), 3000);
        }
      },
      error: (err) => {
        this.addStatus.set(false);
        this.addMessage.set(err.error?.message ?? 'Something went wrong.');
        setTimeout(() => this.addStatus.set(null), 3000);
      }
    });
  }
 
  onDelete(addressId: number) {
    const userId = this._modalService.loggedInUserId();
    if (!userId) return;
 
    this._http.deleteShippingAddress(addressId, userId).subscribe({
      next: (res: any) => {
        if (res.success) this.loadAddresses(); 
      }
    });
  }
}