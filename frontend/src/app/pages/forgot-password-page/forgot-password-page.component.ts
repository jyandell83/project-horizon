import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password-page.component.html',
  styleUrl: './forgot-password-page.component.scss',
})
export class ForgotPasswordPageComponent {
  private formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly forgotPasswordForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  onSubmit() {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    const { email } = this.forgotPasswordForm.getRawValue();

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.authService
      .requestPasswordReset(email)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
        }),
      )
      .subscribe({
        next: (response) => {
          this.successMessage.set(response.message);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.error?.message ??
              'Unable to process your request. Please try again.',
          );
        },
      });
  }
}
