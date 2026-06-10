import { Component, computed, inject, input, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ApiConnectionService } from "../../Services/api-connection-service";
import { addCategoryInterface } from "../../Interfaces/add-category-interface";
import { TranslateModule } from "@ngx-translate/core";
import { UpdateCategoryInterface } from "../../Interfaces/update-category-interface";

@Component({
  selector: "app-add-category-page",
  imports: [ReactiveFormsModule, TranslateModule],
  templateUrl: "./add-category-page.html",
  styleUrl: "./add-category-page.scss",
})
export class AddCategoryPage {
  private readonly _fb = inject(FormBuilder);
  private readonly _http = inject(ApiConnectionService);

  hasParent = signal(false);
  categoryAddMessage = signal("");
  categoryAddStatus = signal<boolean | null>(null);
  categories = signal<any[]>([]);
  selectedCategoryId: number | null = null;

  resolvedData = input<any[] | undefined>(undefined, {
    alias: "categories",
  });

  ngOnInit(): void {
    const data = this.resolvedData();

    if (data) {
      this.categories.set(data);
    }
  }

  imagePreview = computed(() => {
    const url = this.categoryForm.get("image")?.value;
    return url?.trim() || null;
  });

  categoryForm = this._fb.group({
    name: ["", [Validators.required, Validators.minLength(2)]],
    image: ["", [Validators.pattern("https?://.+")]],
    parentCategoryId: [{ value: "", disabled: true }],
  });

  toggleParent(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.setParentToggle(checked);
  }

  toggleParentLabel() {
    this.setParentToggle(!this.hasParent());
  }

  private setParentToggle(enabled: boolean) {
    this.hasParent.set(enabled);

    const ctrl = this.categoryForm.get("parentCategoryId");

    if (enabled) {
      ctrl?.enable();
      ctrl?.setValidators([Validators.required]);
    } else {
      ctrl?.disable();
      ctrl?.clearValidators();
      ctrl?.setValue("");
    }

    ctrl?.updateValueAndValidity();
  }

  onImageError() {
    this.categoryForm.get("image")?.setValue("");
  }

  onSubmit() {

    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const formData: UpdateCategoryInterface = {
      id : this.selectedCategoryId!,
      name: this.categoryForm.value.name ?? "",
      image: this.categoryForm.value.image ?? "",
      parentCategoryId: this.categoryForm.get("parentCategoryId")?.value
        ? Number(this.categoryForm.get("parentCategoryId")?.value)
        : null,
    };

    // EDIT
    if (this.selectedCategoryId !== null) {

      this._http
        .editCategory(this.selectedCategoryId, formData)
        .subscribe({
          next: (res : any) => {
            console.log(res);
            if (!res.success) {
              const msg = res.message;
              
              if (msg === "Category with this name already exists.") {
                this.categoryAddMessage.set("addCategory.messages.alreadyExists");
              } else {
                this.categoryAddMessage.set("addCategory.messages.genericError");
              }
              
              this.categoryAddStatus.set(false);

              setTimeout(() => {
                this.categoryAddStatus.set(null);
                this.categoryAddMessage.set("");
              }, 3000);
              return;
            }

            this.categoryAddStatus.set(true);
            this.categoryAddMessage.set("addCategory.messages.updateSuccess");

            this.selectedCategoryId = null;

            this.categoryForm.reset();

            this.setParentToggle(false);

            this.getCategories();

            setTimeout(() => {
              this.categoryAddStatus.set(null);
              this.categoryAddMessage.set("");
            }, 3000);
          },

          error: (err) => {
            console.log(err);

            this.categoryAddStatus.set(false);
            this.categoryAddMessage.set("addCategory.messages.genericError");

            setTimeout(() => {
              this.categoryAddStatus.set(null);
              this.categoryAddMessage.set("");
            }, 3000);
          },
        });

    }

    // ADD
    else {

      this._http
        .addCategory(formData)
        .subscribe({
          next: (res : any) => {
            console.log(res);
            if (!res.success) {
              const msg = res.message;
              if (msg === "Category with this name already exists.") {
                this.categoryAddMessage.set("addCategory.messages.alreadyExists");
              } else {
                this.categoryAddMessage.set("addCategory.messages.genericError");
              }
              this.categoryAddStatus.set(false);
              setTimeout(() => {
                this.categoryAddStatus.set(null);
                this.categoryAddMessage.set("");
              }, 3000);
              return;
            }

            this.categoryAddStatus.set(true);
            this.categoryAddMessage.set("addCategory.messages.success");

            this.categoryForm.reset();

            this.setParentToggle(false);

            this.getCategories();
            
            setTimeout(() => {
              this.categoryAddStatus.set(null);
              this.categoryAddMessage.set("");
            }, 3000);
          },

          error: (err) => {
            console.log(err);

            this.categoryAddStatus.set(false);
            this.categoryAddMessage.set("addCategory.messages.genericError");
          },
        });

    }
  }

  getCategories() {
    this._http.getAllCategories().subscribe({
      next: (res: any) => {

        console.log(res);

        this.categories.set(res.data);

      },

      error: (err) => {
        console.log(err);
      },
    });
  }
  onCardImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = "none";
  }

  getParentName(parentId: number): string {
    return (
      this.categories().find((c) => c.id === parentId)?.name ??
      `#${parentId}`
    );
  }

  onEdit(cat: any) {

    this.selectedCategoryId = cat.id;

    this.categoryForm.patchValue({
      name: cat.name,
      image: cat.image ?? "",
    });

    if (cat.parentCategoryId) {

      this.setParentToggle(true);

      this.categoryForm.patchValue({
        parentCategoryId: String(cat.parentCategoryId),
      });

    } else {

      this.setParentToggle(false);

      this.categoryForm.patchValue({
        parentCategoryId: "",
      });
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  onDelete(id: number) {

    if (!confirm("Delete this category?")) return;

    this._http.deleteCategory(id).subscribe({
      next: () => {
        this.categories.update((list) =>
          list.filter((c) => c.id !== id)
        );
      },

      error: (err) => console.error(err),
    });
  }
}