import { Component, inject, input, OnInit, signal } from "@angular/core";
import {
  FormArray,
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ApiConnectionService } from "../../Services/api-connection-service";
import { BrandCategoryPayload } from "../../Resolvers/brands-and-categories-resolver";
import { TranslateModule } from "@ngx-translate/core";

@Component({
  selector: "app-add-product-page",
  imports: [ReactiveFormsModule, TranslateModule],
  templateUrl: "./add-product-page.html",
  styleUrl: "./add-product-page.scss",
})
export class AddProductPage implements OnInit {
  private readonly _fb = inject(FormBuilder);
  private readonly _http = inject(ApiConnectionService);

  productAddMessage = signal("");
  productAddStatus = signal<boolean | null>(null);
  
  products = signal<any[]>([]);
  selectedProductId: number | null = null;

  resolvedData = input<BrandCategoryPayload | undefined>(undefined, {
    alias: 'brandsAndCategories'
  });
  brands = signal<any[]>([]);
  categories = signal<any[]>([]);

  productForm = this._fb.group({
    id: [0],
    name: ["", [Validators.required, Validators.minLength(2)]],
    categoryId: ["", [Validators.required]],
    brandId: ["", [Validators.required]],
    description: ["", [Validators.required]],
    price: ["", [Validators.required, Validators.min(0.01)]],
    stock: ["", [Validators.required, Validators.min(0)]],
    warrantyMonths: ["", [Validators.required, Validators.min(0)]],
    images: this._fb.array([], [Validators.required, Validators.minLength(3)]),
  });

  get images(): FormArray {
    return this.productForm.get("images") as FormArray;
  }

  ngOnInit(): void {
    const data = this.resolvedData();
    if (data) {
      this.brands.set(data.brands || []);
      this.categories.set(data.categories || []);
    }
    this.getProducts();
  }

  getProducts() {
    this._http.getAllProducts().subscribe({
      next: (res: any) => {
        const productList = (res.data && Array.isArray(res.data.data)) ? res.data.data : [];

        const sortedProducts = productList.sort(
          (a: any, b: any) => a.stock - b.stock
        );

        this.products.set(sortedProducts);
      },
      error: (err) => console.error(err)
    });
  }
  addImage(event: Event) {
    event.preventDefault();
    const inputEl = event.target as HTMLInputElement;
    const value = inputEl.value.trim();

    if (value && Validators.pattern("https?://.+")(new FormControl(value)) === null) {
      this.images.push(this._fb.control(value));
      inputEl.value = "";
    }
  }

  removeImage(index: number) {
    this.images.removeAt(index);
  }

  onCardImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = "none";
  }

  onEdit(prod: any) {
    this.selectedProductId = prod.id;

    this.productForm.patchValue({
      id: prod.id,
      name: prod.name,
      categoryId: String(prod.categoryId),
      brandId: String(prod.brandId),
      description: prod.description,
      price: prod.price,
      stock: prod.stock,
      warrantyMonths: prod.warrantyMonths,
    });

    this.images.clear();
    if (prod.images && Array.isArray(prod.images)) {
      prod.images.forEach((url: string) => {
        this.images.push(this._fb.control(url));
      });
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  onDelete(id: number) {
    if (!confirm("Delete this product?")) return;

    this._http.deleteProduct(id).subscribe({
      next: () => {
        this.products.update((list) => list.filter((p) => p.id !== id));
      },
      error: (err) => console.error(err),
    });
  }

  onSubmit() {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    } 
    
    const formData = {
      id: this.selectedProductId, // 🔥 IMPORTANT
      name: this.productForm.value.name,
      categoryId: Number(this.productForm.value.categoryId),
      brandId: Number(this.productForm.value.brandId),
      description: this.productForm.value.description,
      price: Number(this.productForm.value.price),
      stock: Number(this.productForm.value.stock),
      warrantyMonths: Number(this.productForm.value.warrantyMonths),
      images: this.productForm.value.images
    };

    if (this.selectedProductId !== null) {
      this._http.editProduct(this.selectedProductId, formData).subscribe({
        next: (res: any) => {
          if (!res.success) {
            this.productAddStatus.set(false);
            this.productAddMessage.set(
              res.message === "Product with this name already exists."
                ? "AddProductPage.messages.alreadyExists"
                : "AddProductPage.messages.error"
            );
            setTimeout(() => {
              this.productAddStatus.set(null);
              this.productAddMessage.set("");
            }, 3000);
            return;
          }
          this.productAddStatus.set(true);
          this.productAddMessage.set("AddProductPage.messages.success"); // ✅
          this.resetFormState();
        },
        error: () => {
          this.productAddStatus.set(false);
          this.productAddMessage.set("AddProductPage.messages.error"); // ✅
        }
      });
    } else {
      this._http.addProduct(formData).subscribe({
        next: (res: any) => {
          if (!res.success) {
            this.productAddStatus.set(false);
            this.productAddMessage.set(
              res.message === "Product with this name already exists."
                ? "AddProductPage.messages.alreadyExists"
                : "AddProductPage.messages.error"
            );
            setTimeout(() => {
              this.productAddStatus.set(null);
              this.productAddMessage.set("");
            }, 3000);
            return;
          }
          this.productAddStatus.set(true);
          this.productAddMessage.set("AddProductPage.messages.success"); // ✅
          this.resetFormState();
        },
        error: () => {
          this.productAddStatus.set(false);
          this.productAddMessage.set("AddProductPage.messages.error"); // ✅
        }
      });
    }
  }

  private resetFormState() {
    this.productForm.reset({
      categoryId: "",
      brandId: ""
    });
    this.images.clear();
    this.selectedProductId = null;
    this.getProducts();

    setTimeout(() => {
      this.productAddStatus.set(null);
      this.productAddMessage.set("");
    }, 3000);
  }
}