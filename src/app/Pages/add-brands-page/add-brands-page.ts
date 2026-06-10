import { Component, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiConnectionService } from '../../Services/api-connection-service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-add-brands-page',
  standalone: true, 
  imports: [ReactiveFormsModule, TranslateModule], 
  templateUrl: './add-brands-page.html',
  styleUrl: './add-brands-page.scss',
})
export class AddBrandsPage implements OnInit {
  private readonly _fb = inject(FormBuilder);
  private readonly _http = inject(ApiConnectionService);

  brandAddMessage = signal("");
  brandAddStatus = signal<boolean | null>(null);
  brands = signal<any[]>([]);
  selectedBrandId: number | null = null;

  resolvedData = input<any[] | undefined>(undefined, {
    alias: "brands",
  });

  ngOnInit(): void {
    const data = this.resolvedData();
    if (data) {
      this.brands.set(data);
    }
  }

  brandForm = this._fb.group({
    name: ["", [Validators.required, Validators.minLength(2)]],
  });

  onSubmit() {
    if (this.brandForm.invalid) {
      this.brandForm.markAllAsTouched();
      return;
    }

    const brandName = this.brandForm.value.name ?? "";

    // EDIT რეჟიმი (EDIT Mode)
    if (this.selectedBrandId !== null) {
      // Create payload matching UpdateBrandInterface structural expectation
      const updatePayload = {
        id: this.selectedBrandId,
        name: brandName
      };

      this._http
        .editBrand(this.selectedBrandId, updatePayload)
        .subscribe({
          next: (res) => {
            this.brandAddStatus.set(true);
            this.brandAddMessage.set("addBrand.messages.updateSuccess");
            this.selectedBrandId = null;
            this.brandForm.reset();
            this.getBrands();

            setTimeout(() => {
              this.brandAddStatus.set(null);
              this.brandAddMessage.set("");
            }, 3000);
          },
          error: (err) => {
            this.brandAddStatus.set(false);
            this.brandAddMessage.set("addBrand.messages.updateError");

            setTimeout(() => {
              this.brandAddStatus.set(null);
              this.brandAddMessage.set("");
            }, 3000);
          },
        });
    } 
    // ADD რეჟიმი (ADD Mode)
    else {
      // Send object payload to service matching standard API expectations
      const createPayload = { name: brandName };

      this._http
        .addBrand(createPayload)
        .subscribe({
          next: (res) => {
            this.brandAddStatus.set(true);
            this.brandAddMessage.set("addBrand.messages.addSuccess");
            this.brandForm.reset();
            this.getBrands();

            setTimeout(() => {
              this.brandAddStatus.set(null);
              this.brandAddMessage.set("");
            }, 3000);
          },
          error: (err) => {
            this.brandAddStatus.set(false);
            this.brandAddMessage.set("addBrand.messages.addError");
            
            setTimeout(() => {
              this.brandAddStatus.set(null);
              this.brandAddMessage.set("");
            }, 3000);
          },
        });
    }
  }

  getBrands() {
    this._http.getAllBrands().subscribe({
      next: (res: any) => {
        this.brands.set(res.data || res);
      },
      error: (err) => console.error(err),
    });
  }

  onEdit(brand: any) {
    this.selectedBrandId = brand.id;
    this.brandForm.patchValue({
      name: brand.name,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  onDelete(id: number) {
    if (!confirm("Delete this brand?")) return;

    this._http.deleteBrand(id).subscribe({
      next: () => {
        this.brands.update((list) => list.filter((b) => b.id !== id));
      },
      error: (err) => console.error(err),
    });
  }
}