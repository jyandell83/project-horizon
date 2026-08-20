import { Component, inject } from '@angular/core';

import { SessionsService } from '../../services/sessions.service';

import { ClimbingSession } from '../../models/session';

import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-session-edit-page',
  standalone: true,
  imports: [],
  templateUrl: './session-edit-page.component.html',
  styleUrl: './session-edit-page.component.scss',
})
export class SessionEditPageComponent {
  sessionId?: string;
  session?: ClimbingSession;

  private sessionsService = inject(SessionsService);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      this.sessionId = idParam;
      this.session = this.sessionsService.getSessionById(this.sessionId);
    }
  }
}
