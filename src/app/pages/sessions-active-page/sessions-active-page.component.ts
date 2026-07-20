import { Component, inject } from '@angular/core';
import { ActiveSessionComponent } from '../../components/active-session/active-session.component';
import { SessionsService } from '../../services/sessions.service';
import { SessionPhaseType } from '../../models/session';

@Component({
  selector: 'app-sessions-active-page',
  standalone: true,
  imports: [ActiveSessionComponent],
  templateUrl: './sessions-active-page.component.html',
  styleUrl: './sessions-active-page.component.scss',
})
export class SessionsActivePageComponent {
  private readonly sessionsService = inject(SessionsService);

  readonly activeSession = this.sessionsService.activeSession;

  startSession(): void {
    this.sessionsService.startSession();
  }

  startPhase(type: SessionPhaseType): void {
    this.sessionsService.startPhase(type);
  }

  onProjectAdded(projectId: string): void {
    this.sessionsService.addProjectToCurrentPhase(projectId);
  }

  endPhase(): void {
    this.sessionsService.endCurrentPhase();
  }

  endSession(): void {
    this.sessionsService.endSession();
  }
}
