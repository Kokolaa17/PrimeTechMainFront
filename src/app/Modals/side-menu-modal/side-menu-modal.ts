import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { ApiConnectionService } from '../../Services/api-connection-service';
import { ModalService } from '../../Services/modal-service';
import { jwtDecode } from 'jwt-decode';
import { CookieService } from 'ngx-cookie-service';
import { RouterLinkActive, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-side-menu-modal',
  imports: [RouterModule, RouterLinkActive, TranslateModule],
  templateUrl: './side-menu-modal.html',
  styleUrl: './side-menu-modal.scss',
  standalone: true,
})
export class SideMenuModal {

  private readonly _http = inject(ApiConnectionService)
  private readonly _modalService = inject(ModalService)
  private readonly _cookieService = inject(CookieService)

  userRole = signal<null | number>(null);

  constructor() {
    effect(() => {
      if (this._modalService.isUserLoggedIn()) {
        try {
          const token = this._cookieService.get('token');
          if (token) {
            const decoded: any = jwtDecode(token);
            const userIdFromToken = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
            this.getUserRole(userIdFromToken);
          }
        } catch (error) {
          console.error("Error decoding token in effect:", error);
        }
      } else {
        this.clearLocalSignals();
      }
    });
  }
  

    getUserRole(userId: string) {
    this._http.getUserInfo(userId).subscribe({
      next: (response) => {
        this.userRole.set(response.data.role);  
        console.log(this.userRole())
      },
      error: (error) => {
        console.error("Error fetching user info:", error);
      }
    });
  }

  clearLocalSignals() {
    this.userRole.set(null);
  }
}
