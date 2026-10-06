import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ClimbingSession } from '../../models/session';

import { SessionsService } from '../../services/sessions.service';
import { ProjectsService } from '../../services/projects.service';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import {
  faCalendar,
  faClock,
  faEdit,
  faEllipsis,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-session-list',
  standalone: true,
  imports: [DatePipe, RouterLink, FontAwesomeModule],
  templateUrl: './session-list.component.html',
  styleUrl: './session-list.component.scss',
})
export class SessionListComponent {
  private readonly sessionsService = inject(SessionsService);
  private readonly projectsService = inject(ProjectsService);

  readonly sessions = this.sessionsService.sessions;

  faCalendar = faCalendar;
  faClock = faClock;
  faEllipsis = faEllipsis;
  faEdit = faEdit;
  faTrash = faTrash;

  deleteSession(id: string): void {
    if (confirm('Delete this session?')) {
      this.sessionsService.deleteSession(id);
    }
  }

  getProjectName(projectId: number): string {
    return (
      this.projectsService.getProjectById(projectId)?.name ?? 'Unknown Project'
    );
  }

  getDuration(session: {
    startedAt: string | Date;
    endedAt?: string | Date | null;
  }): string {
    if (!session.endedAt) return '';
    const ms =
      new Date(session.endedAt).getTime() -
      new Date(session.startedAt).getTime();
    const totalMinutes = Math.max(0, Math.round(ms / 60_000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
  }
}
