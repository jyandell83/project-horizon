import { Component, inject } from '@angular/core';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss',
})
export class ProfilePageComponent {
  private authService = inject(AuthService);

  readonly currentUser = this.authService.currentUser;
}
