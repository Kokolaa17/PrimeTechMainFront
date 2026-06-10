import { Component, inject, signal } from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ModalService } from "../../Services/modal-service";
import { Router } from "@angular/router";
import { registerInterface } from "../../Interfaces/register-interface";
import { ApiConnectionService } from "../../Services/api-connection-service";
import { TranslateModule } from "@ngx-translate/core";

@Component({
  selector: "app-register-page",
  imports: [ReactiveFormsModule, TranslateModule],
  templateUrl: "./register-page.html",
  styleUrl: "./register-page.scss",
})
export class RegisterPage {
  private readonly _routeR = inject(Router);
  private readonly _modalService = inject(ModalService);
  private readonly _http = inject(ApiConnectionService);

  isRegistrationSuccessful = signal<boolean | any>(null);
  registrationMessage = signal<string>("");
  showPaassword = signal(false);

  registerForm = new FormGroup({
    name: new FormControl("", [Validators.required, Validators.maxLength(50)]),
    lastName: new FormControl("", [
      Validators.required,
      Validators.maxLength(50),
    ]),
    email: new FormControl("", [Validators.required, Validators.email]),
    password: new FormControl("", [
      Validators.required,
      Validators.minLength(6),
    ]),
  });

  registerUser() {
    if (this.registerForm.valid) {
      const newUser = this.registerForm.value;
      this._http.registerUser(newUser as registerInterface).subscribe({
        next: (response: any) => {
          this.registerForm.reset();
          this.isRegistrationSuccessful.set(response.success);

          if (response.success) {
            this.registrationMessage.set("register.messages.success");
          } else {
            
            const cleanMsg = response.message
              ? response.message.toLowerCase().trim()
              : "";
            if (
              cleanMsg.includes("already exists") ||
              cleanMsg.includes("taken")
            ) {
              this.registrationMessage.set("register.messages.alreadyExists");
            } else {
              this.registrationMessage.set("register.messages.genericError");
            }
          }

          sessionStorage.setItem("verificationEmail", newUser.email || "");

          setTimeout(() => {
            this.isRegistrationSuccessful.set(null);
            this.registrationMessage.set("");
            this._routeR.navigate(["/"]);
            this._modalService.openVerifyUserModal();
          }, 4000);
        },
        error: (error) => {
          console.error("Error registering user:", error);
          this.registerForm.reset();
          this.isRegistrationSuccessful.set(false);
          this.registrationMessage.set("register.messages.genericError");
        },
      });
    }
  }

  goToLogin() {
    this._routeR.navigate(["/"]);
    this._modalService.openLogInModal();
  }

  toggleShowPassword() {
    this.showPaassword.set(!this.showPaassword());
  }
}
