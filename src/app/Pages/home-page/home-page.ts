import {
  Component,
  inject,
  signal,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { ApiConnectionService } from '../../Services/api-connection-service';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommercialComponent } from "../../Components/HomePageComponents/commercial-component/commercial-component";
import { TranslateModule } from '@ngx-translate/core';
import { CategoriesSwiperComponent } from '../../Components/HomePageComponents/categories-swiper-component/categories-swiper-component';

@Component({
  selector: 'app-home-page',
  imports: [CommercialComponent, TranslateModule, CategoriesSwiperComponent],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage implements OnInit, OnDestroy {
  private readonly _http = inject(ApiConnectionService);

  private intervalId?: number;

  allCategories = toSignal(
    this._http.getAllCategories().pipe(
      map((response) => response.data)
    ),
    { initialValue: [] }
  );

  public welcomeSectionImages: string[] = [
    '/images/welcomeBG1.avif',
    '/images/welcomeBG2.avif',
    '/images/welcomeBG3.avif',
  ];

  showingImageIndex = signal(0);

  ngOnInit(): void {
    this.changeShowingImage();
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private changeShowingImage(): void {
    this.intervalId = window.setInterval(() => {
      this.showingImageIndex.update(
        (value) => (value + 1) % this.welcomeSectionImages.length
      );
    }, 5000);
  }
}