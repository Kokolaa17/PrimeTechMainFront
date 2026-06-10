import { inject, Injectable, signal } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { CookieService } from 'ngx-cookie-service';
import { Subject } from 'rxjs';
import { ApiConnectionService } from './api-connection-service';

@Injectable({
  providedIn: 'root',
})
export class ModalService {

  private readonly _cookieSerivce = inject(CookieService)
  private readonly _http = inject(ApiConnectionService)

  loggedInUserId = signal<number | null>(this._getDecodedUserId());

  private _getDecodedUserId(): number | null {
    const token = this._cookieSerivce.get('token');
    if (!token) return null;
    try {
      const decoded: any = jwtDecode(token);
      const id = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
      return Number(id) || null;
    } catch {
      return null;
    }
  }

  updateGlobalCartCount() {
    const userId = this.loggedInUserId();
    if (!userId) return;

    this._http.getCart(userId).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.totalCartItems.set(res.data.totalItems);
        }
      }
    });
  }

  // auth
  isUserLoggedIn = signal<boolean>(!!this._cookieSerivce.get('token'));

  login(token: string) {
    this._cookieSerivce.set('token', token);
    this.isUserLoggedIn.set(true);
    this.loggedInUserId.set(this._getDecodedUserId()); // ✅
  }

  logout() {
    this._cookieSerivce.delete('token');
    this.isUserLoggedIn.set(false);
    this.loggedInUserId.set(null); // ✅
  }
  
  // log in modal
  isLogInModalOpen = signal(false);

  openLogInModal() {
    this.isLogInModalOpen.set(true);
  }

  closeLogInModal() {
    this.isLogInModalOpen.set(false);
  }

  // verify user modal
  isVerifyUserModalOpen = signal(false);

  openVerifyUserModal() {
    this.isVerifyUserModalOpen.set(true);
  }

  closeVerifyUserModal() {
    this.isVerifyUserModalOpen.set(false);
  }

  // edit user modal
  isEditUserModalOpen = signal(false);

  openEditUserModal() {
    this.isEditUserModalOpen.set(true);
  }

  closeEditUserModal() {
    this.isEditUserModalOpen.set(false);
  }


  // deposit modal
  isDepositModalOpen = signal(false);

  openDepositModal() {
    this.isDepositModalOpen.set(true);
  }

  closeDepositModal() {
    this.isDepositModalOpen.set(false);
  }

  // side menu
  isSideMenuModalOpen = signal(false)

  openSideMenuModal(){
    this.closeCartModal()
    this.isSideMenuModalOpen.set(true)
  }

  closeSideMenuModal(){
    this.isSideMenuModalOpen.set(false)
  }
  
  // cart
  isCartModalOpen = signal(false);

  openCartModal() 
  {
    this.closeSideMenuModal()
    this.isCartModalOpen.set(true); 
  }

  closeCartModal() 
  { 
    this.isCartModalOpen.set(false); 
  }

  totalCartItems = signal<number>(0);
  cartRefresh$ = new Subject<void>(); 

  triggerCartRefresh() {
    this.cartRefresh$.next();
  }
}
