import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
})
export class LoginPageComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  private formBuilder = inject(FormBuilder);

  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();

      return;
    }

    const { email, password } = this.loginForm.getRawValue();

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.authService
      .login(email, password)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.router.navigate(['/projects']);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.error?.message ?? 'Unable to log in. Please try again.',
          );
        },
      });
  }
}
