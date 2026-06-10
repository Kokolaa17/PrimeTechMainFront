import { Component, computed, effect, inject, OnInit, signal } from "@angular/core";
import { ModalService } from "../../Services/modal-service";
import { Router, RouterLink } from "@angular/router";
import { LogInModal } from "../../Modals/log-in-modal/log-in-modal";
import { VerifyUserModal } from "../../Modals/verify-user-modal/verify-user-modal";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { CookieService } from "ngx-cookie-service";
import { jwtDecode } from 'jwt-decode';
import { ApiConnectionService } from "../../Services/api-connection-service";
import { SideMenuModal } from "../../Modals/side-menu-modal/side-menu-modal";
import { CartModal } from "../../Modals/cart-modal/cart-modal";
import { Subscription } from "rxjs";

@Component({
  selector: "app-nav-bar-component",
  imports: [LogInModal, RouterLink, VerifyUserModal, TranslateModule, SideMenuModal, CartModal],
  templateUrl: "./nav-bar-component.html",
  styleUrl: "./nav-bar-component.scss",
  standalone: true,
})
export class NavBarComponent implements OnInit {

  constructor() {
    effect(() => {
      if (this.isUserLoggedIn()) {
        try {
          const token = this._cookieSerivce.get('token');
          if (token) {
            const decoded: any = jwtDecode(token);
            const userIdFromToken = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
            this.getUserInfo(userIdFromToken);
          }
        } catch (error) {
          console.error("Error decoding token in effect:", error);
        }
      } else {
        this.clearLocalSignals();
      }
    });
  }

  private translate = inject(TranslateService);

  private readonly _modalService = inject(ModalService);
  private readonly _router = inject(Router);
  private readonly _cookieSerivce = inject(CookieService);
  private readonly _apiConnectionService = inject(ApiConnectionService);

  private cartSub!: Subscription;

  searchResult = signal<any[]>([]);
  userName = signal<string | null>(null);
  userId = signal<string | null>(null);
  userRole = signal<number | null>(null);
  totalItems = this._modalService.totalCartItems;

  isSideMenuModalOpen = computed(() => this._modalService.isSideMenuModalOpen())
  isLogInModalOpen = computed(() => this._modalService.isLogInModalOpen());
  isVerifyUserModalOpen = computed(() => this._modalService.isVerifyUserModalOpen());
  isUserLoggedIn = computed(() => this._modalService.isUserLoggedIn());
  isCartModalOpen = computed(() => this._modalService.isCartModalOpen())

  ngOnInit() {
    if (!this.translate.currentLang) {
      this.translate.use("en");
    }
    this._modalService.updateGlobalCartCount();
    this.cartSub = this._modalService.cartRefresh$.subscribe(() => {
      this._modalService.updateGlobalCartCount();
    });
  }

  get currentLanguage(): string {
    return this.translate.currentLang || "en";
  }

  switchLanguage(lang: string) {
    this.translate.use(lang);
  }

  openLogIn() {
    this._router.navigate(["/"]);
    this._modalService.openLogInModal();
  }

  getUserInfo(userId: string) {
    this._apiConnectionService.getUserInfo(userId).subscribe({
      next: (response) => {
        this.userName.set(response.data.name);
        this.userId.set(userId);
        this.userRole.set(response.data.role);
        localStorage.setItem('user', JSON.stringify(response.data));
        if(response.data.role == 1){
          this._router.navigate(['/user', this.userId()]);
        }
      },
      error: (error) => {
        console.error("Error fetching user info:", error);
      }
    });
  }

  private clearLocalSignals() {
    this.userName.set(null);
    this.userId.set(null);
    this.userRole.set(null);
  }

  openUserPage() {
    this._router.navigate(['/user', this.userId()]);
  }

  toggleSideMenuModal(){
    if(this.isSideMenuModalOpen()){
      this._modalService.closeSideMenuModal()
    }
    else {
      this._modalService.openSideMenuModal()
    }
  }

  toggleCartModal(){
    if(this.isCartModalOpen()){
      this._modalService.closeCartModal()
    }
    else {
      this._modalService.openCartModal()
    }
  }
}


