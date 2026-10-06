import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../services/auth.service';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faRightFromBracket,
  faEnvelope,
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, FontAwesomeModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly currentUser = this.authService.currentUser;
  readonly isLoggingOut = signal(false);

  readonly isResendingVerification = signal(false);
  readonly verificationMessage = signal<string | null>(null);

  faRightFromBracket = faRightFromBracket;
  faEnvelope = faEnvelope;

  logout() {
    this.isLoggingOut.set(true);

    this.authService
      .logout()
      .pipe(
        finalize(() => {
          this.isLoggingOut.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.router.navigate(['/login']);
        },
      });
  }

  resendVerificationEmail() {
    this.isResendingVerification.set(true);
    this.verificationMessage.set(null);

    this.authService
      .resendVerificationEmail()
      .pipe(
        finalize(() => {
          this.isResendingVerification.set(false);
        }),
      )
      .subscribe({
        next: (response) => {
          this.verificationMessage.set(response.message);
        },
        error: () => {
          this.verificationMessage.set(
            'Unable to resend verification email. Please try again.',
          );
        },
      });
  }
}
