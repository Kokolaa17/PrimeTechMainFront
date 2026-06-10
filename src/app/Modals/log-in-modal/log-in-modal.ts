import { Component, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import { ModalService } from "../../Services/modal-service";
import { ApiConnectionService } from "../../Services/api-connection-service";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { LogInInterface } from "../../Interfaces/log-in-interface";
import { ApiResponseInterface } from "../../Interfaces/api-response-interface";
import { _, TranslateModule } from "@ngx-translate/core";

@Component({
  selector: "app-log-in-modal",
  imports: [ReactiveFormsModule, TranslateModule],
  templateUrl: "./log-in-modal.html",
  styleUrl: "./log-in-modal.scss",
})
export class LogInModal {
  private readonly _router = inject(Router);
  private readonly _modalService = inject(ModalService);
  private readonly _http = inject(ApiConnectionService);

  isLogInSuccessful = signal<boolean | null>(null);
  logInMessage = signal<string>("");
  showPaassword = signal(false);

  goToRegister() {
    this._modalService.closeLogInModal();
    this._router.navigate(["/register"]);
  }

  logInForm = new FormGroup({
    email: new FormControl("", [Validators.email, Validators.required]),
    password: new FormControl("", [
      Validators.required,
      Validators.minLength(6),
    ]),
  });

  logIn() {
    if (this.logInForm.valid) {
      const logInData = this.logInForm.value;

      this._http.logInUser(logInData as LogInInterface).subscribe({
        next: (response: ApiResponseInterface<any>) => {
          this.logInForm.reset();

          if (response.success) {
            this.isLogInSuccessful.set(true);
            this.logInMessage.set("logIn.messages.success");
            this._modalService.login(response.data);
            setTimeout(() => {
              this._modalService.closeLogInModal();
            }, 3000);
          } else {
            this.isLogInSuccessful.set(false);

            const cleanMessage = response.message
              ? response.message.toLowerCase().trim()
              : "";

            if (cleanMessage.includes("not verified")) {
              this.logInMessage.set("logIn.messages.unverified");

              setTimeout(() => {
                this._modalService.closeLogInModal();
                this._modalService.openVerifyUserModal();
                this._router.navigate(["/"]);
              }, 3000);
            } else {
              this.logInMessage.set("logIn.messages.invalid");
            }
          }
        },
        error: (error) => {
          console.error("Error logging in:", error);
          this.logInForm.reset();
          this.isLogInSuccessful.set(false);
          this.logInMessage.set("logIn.messages.genericError");
        },
      });
    }
  }

  closeLogIn() {
    this._modalService.closeLogInModal();
  }

  toggleShowPassword() {
    this.showPaassword.set(!this.showPaassword());
  }
}
