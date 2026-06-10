import { Component, computed, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavBarComponent } from "./Components/nav-bar-component/nav-bar-component";
import { ApiConnectionInterceptorService } from './Services/api-connection-interceptor-service';
import { LoadingScreenComponent } from './Components/loading-screen-component/loading-screen-component';
import { FooterComponent } from "./Components/footer-component/footer-component";

@Component({
  selector: 'app-root',
  imports: [NavBarComponent, RouterOutlet, LoadingScreenComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('PrimeTechFront');

  private readonly _interceptorService = inject(ApiConnectionInterceptorService)

  isApiCallGoing = computed(() => this._interceptorService.isApiConnectionGoing())
}
