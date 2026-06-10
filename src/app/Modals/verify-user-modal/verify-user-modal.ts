import { Component, inject, OnInit, signal } from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ModalService } from "../../Services/modal-service";
import { ApiConnectionService } from "../../Services/api-connection-service";
import { VerifyUserInterface } from "../../Interfaces/verify-user-interface";
import { TranslateModule } from "@ngx-translate/core";

@Component({
  selector: "app-verify-user-modal",
  imports: [ReactiveFormsModule, TranslateModule],
  templateUrl: "./verify-user-modal.html",
  styleUrl: "./verify-user-modal.scss",
})
export class VerifyUserModal implements OnInit {
  private readonly _http = inject(ApiConnectionService);
  private readonly _modalService = inject(ModalService);

  sessionEmail: string = "";
  isVerifySuccessful = signal<boolean | null>(null);
  verifyMessage = signal<string | null>(null);

  verifyForm = new FormGroup({
    email: new FormControl("", [Validators.email, Validators.required]),
    code: new FormControl("", [
      Validators.required,
      Validators.maxLength(6),
      Validators.minLength(6),
    ]),
  });

  ngOnInit() {
    this.sessionEmail = sessionStorage.getItem("verificationEmail") || "";

    if (this.sessionEmail) {
      this.verifyForm.patchValue({
        email: this.sessionEmail,
      });
    }
  }

  closeVerify() {
    this._modalService.closeVerifyUserModal();
  }

  verifyUser() {
    if (this.verifyForm.valid) {
      const verificationData = this.verifyForm.value;
      this._http.verifyUser(verificationData as VerifyUserInterface).subscribe({
        next: (response: any) => {
          this.verifyForm.reset();
          this.isVerifySuccessful.set(response.success);

          if (response.success) {
            this.verifyMessage.set("verifyUser.messages.success");
          } else {
            this.verifyMessage.set("verifyUser.messages.wrongCode");
          }

          sessionStorage.setItem("verificationEmail", verificationData.email!);

          setTimeout(() => {
            this._modalService.closeVerifyUserModal();
            this._modalService.openLogInModal();
          }, 3000);
        },
        error: (error) => {
          console.error("Error verifying user:", error);
          this.verifyForm.reset();
          this.isVerifySuccessful.set(false);

          // 2. სისტემური ერორის ქეისი
          this.verifyMessage.set("verifyUser.messages.genericError");
        },
      });
    }
  }
}
