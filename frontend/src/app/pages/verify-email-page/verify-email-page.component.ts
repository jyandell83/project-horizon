import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-verify-email-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './verify-email-page.component.html',
  styleUrl: './verify-email-page.component.scss',
})
export class VerifyEmailPageComponent {
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.errorMessage.set('Verification link is invalid.');
      this.isLoading.set(false);
      return;
    }

    this.authService
      .verifyEmail(token)
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
        }),
      )
      .subscribe({
        next: (response) => {
          this.successMessage.set(response.message);

          this.authService.checkAuth().subscribe();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.error?.message ??
              'Unable to verify your email. Please try again.',
          );
        },
      });
  }
}
