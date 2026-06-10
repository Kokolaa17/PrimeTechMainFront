import { Component, inject, input, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiConnectionService } from '../../Services/api-connection-service';
import { UpdateUserInterface } from '../../Interfaces/update-user-interface';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-manage-users-page',
  imports: [ReactiveFormsModule, DecimalPipe, TranslateModule],
  templateUrl: './manage-users-page.html',
  styleUrl: './manage-users-page.scss',
})
export class ManageUsersPage implements OnInit {
  private readonly _http = inject(ApiConnectionService);
  private readonly _router = inject(Router);

  selectedUserId: number | null = null;
  users = signal<any[]>([]);

  // Messages status handlers matching product behavior
  updateUserMessage = signal("");
  updateUserStatus = signal<boolean | null>(null);

  resolvedData = input<any[] | undefined>(undefined, {
    alias: "users",
  });

  userForm = new FormGroup({
    name:      new FormControl('',   Validators.required),
    surname:   new FormControl('',   Validators.required),
    email:     new FormControl('',   [Validators.required, Validators.email]),
    avatarUrl: new FormControl<string | null>(null),
    role:      new FormControl(0,    Validators.required),
  });

  ngOnInit(): void {
    const data = this.resolvedData();
    if (data) {
      this.users.set(data);
    }
    this.loadUsers();
  }

  loadUsers(): void {
    this._http.getAllUsers().subscribe({
      next: (res) => {
        this.users.set(res.data || res);
      },
      error: (err) => console.error('Failed to load users', err),
    });
  }

  getRoleName(role: number): string {
    switch (role) {
      case 1:  return 'Admin';
      case 2:  return 'Manager';
      default: return 'User';
    }
  }

  onEdit(user: any): void {
    this.selectedUserId = user.id;

    this.userForm.patchValue({
      name:      user.firstName  ?? user.name      ?? '',
      surname:   user.lastName   ?? user.surname   ?? '',
      email:     user.email      ?? '',
      avatarUrl: user.avatarUrl  ?? '',
      role:      user.role       ?? 0,
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onDelete(id: number): void {
    if (!confirm("Delete this user?")) return; // Optional confirmation safety check

    this._http.deleteUser(id).subscribe({
      next: () => {
        this.users.update(list => list.filter(u => u.id !== id));
      },
      error: (err) => console.error('Delete failed', err),
    });
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched(); // Forces visual validations to trigger
      return;
    }

    const { name, surname, email, avatarUrl, role } = this.userForm.value;

    const playLoad: UpdateUserInterface = {
      id:        this.selectedUserId!,
      firstName: name      ?? null,
      lastName:  surname   ?? null,
      email:     email     ?? null,
      avatarUrl: avatarUrl ?? null,
      role:      role      ?? null,
    };

    if (this.selectedUserId !== null) {
      this._http.updateUser(this.selectedUserId, playLoad as UpdateUserInterface).subscribe({
        next: (res) => {
          this.updateUserStatus.set(true);
          this.updateUserMessage.set("manageUsers.messages.updateSuccess");
          
          this.users.update(list =>
            list.map(u => u.id === this.selectedUserId ? { ...u, ...res.data } : u)
          );
          this.resetFormState();
        },
        error: (err) => {
          console.error('Update failed', err);
          this.updateUserStatus.set(false);
          this.updateUserMessage.set("manageUsers.messages.updateFailed");
        },
      });
    }
  }

  viewUser(user: any): void {
    this._router.navigate(['/user-details', user.id]);
  }

  private resetFormState(): void {
    this.selectedUserId = null;
    this.userForm.reset({ role: 0 });
    this.loadUsers();

    // Clears the message banner after 3 seconds
    setTimeout(() => {
      this.updateUserStatus.set(null);
      this.updateUserMessage.set("");
    }, 3000);
  }
}