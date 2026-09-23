import { Component, inject, signal } from '@angular/core';
import type { AbstractControl, ValidationErrors } from '@angular/forms';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth.service';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-reset-password-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password-page.component.html',
  styleUrl: './reset-password-page.component.scss',
})
export class ResetPasswordPageComponent {
  private formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  private readonly token = this.route.snapshot.queryParamMap.get('token');

  readonly resetPasswordForm = this.formBuilder.nonNullable.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    {
      validators: passwordsMatch,
    },
  );

  onSubmit() {
    if (!this.token) {
      this.errorMessage.set('Password reset link is invalid.');
      return;
    }

    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    const { password } = this.resetPasswordForm.getRawValue();

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.authService
      .resetPassword(this.token, password)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage.set('Your password has been reset.');

          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 1500);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.error?.message ??
              'Unable to reset your password. Please try again.',
          );
        },
      });
  }
}
