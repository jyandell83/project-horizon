import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { SESSIONS } from '../../data/dummy-sessions';
import { ClimbingSession } from '../../models/session';

import { SessionsService } from '../../services/sessions.service';

@Component({
  selector: 'app-session-list',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './session-list.component.html',
  styleUrl: './session-list.component.scss',
})
export class SessionListComponent {
  // sessions: ClimbingSession[] = SESSIONS;
  private readonly sessionsService = inject(SessionsService);

  readonly sessions = this.sessionsService.sessions;

  deleteSession(id: string): void {
    if (confirm('Delete this session?')) {
      this.sessionsService.deleteSession(id);
    }
  }
}
