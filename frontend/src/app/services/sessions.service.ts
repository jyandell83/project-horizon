import { Injectable, signal, inject, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import {
  ClimbingSession,
  SessionPhase,
  SessionPhaseType,
} from '../models/session';

import { ProjectsService } from './projects.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class SessionsService {
  private http = inject(HttpClient);
  private projectsService = inject(ProjectsService);
  private authService = inject(AuthService);
  constructor() {
    effect(
      () => {
        if (this.authService.currentUser()) {
          this.loadSessions();
        } else {
          this.sessionsSignal.set([]);
          this.activeSessionSignal.set(null);
        }
      },
      { allowSignalWrites: true },
    );
  }

  private readonly sessionsSignal = signal<ClimbingSession[]>([]);

  readonly sessions = this.sessionsSignal.asReadonly();
  private readonly activeSessionSignal = signal<ClimbingSession | null>(null);

  readonly activeSession = this.activeSessionSignal.asReadonly();

  private loadSessions(): void {
    const userId = this.authService.currentUser()?.id;

    if (userId === undefined) {
      this.sessionsSignal.set([]);
      this.activeSessionSignal.set(null);

      return;
    }
    this.http.get<ClimbingSession[]>('/api/sessions').subscribe({
      next: (sessions) => {
        if (this.authService.currentUser()?.id !== userId) {
          return;
        }
        this.activeSessionSignal.set(
          sessions.find((session) => session.endedAt === null) ?? null,
        );

        this.sessionsSignal.set(
          sessions.filter((session) => session.endedAt !== null),
        );
      },
      error: (error) => {
        console.error('Failed to load sessions', error);
      },
    });
  }

  getSession(id: string) {
    return this.http.get<ClimbingSession>(`/api/sessions/${id}`);
  }

  private getCurrentPhase(): SessionPhase | null {
    const session = this.activeSessionSignal();

    if (!session) return null;

    return session.phases.at(-1) ?? null;
  }

  addProjectToCurrentPhase(projectId: number): void {
    const session = this.activeSessionSignal();
    const currentPhase = this.getCurrentPhase();

    if (
      !session ||
      currentPhase?.type !== 'project' ||
      currentPhase.endedAt !== null
    ) {
      return;
    }

    this.http
      .post(`/api/sessions/${session.id}/phases/${currentPhase.id}/projects`, {
        projectId,
      })
      .subscribe({
        next: () => {
          this.loadSessions();
        },
        error: (error) => {
          console.error('Failed to add project to phase', error);
        },
      });
  }

  updateProjectAttempts(projectId: number, change: number): void {
    const session = this.activeSessionSignal();
    const currentPhase = this.getCurrentPhase();

    if (!session || !currentPhase) {
      return;
    }

    this.http
      .patch(
        `/api/sessions/${session.id}/phases/${currentPhase.id}/projects/${projectId}/attempts`,
        { change },
      )
      .subscribe({
        next: () => {
          this.loadSessions();
        },
        error: (error) => {
          console.error('Failed to update attempts', error);
        },
      });
  }

  markProjectSent(projectId: number): void {
    const session = this.activeSessionSignal();
    const currentPhase = this.getCurrentPhase();

    if (!session || !currentPhase) {
      return;
    }

    this.http
      .patch(
        `/api/sessions/${session.id}/phases/${currentPhase.id}/projects/${projectId}/sent`,
        {},
      )
      .subscribe({
        next: () => {
          this.loadSessions();
        },
        error: (error) => {
          console.error('Failed to mark project sent', error);
        },
      });
  }

  startSession(location: string): void {
    if (this.activeSessionSignal()) {
      return;
    }

    this.http.post<ClimbingSession>('/api/sessions', { location }).subscribe({
      next: (session) => {
        this.activeSessionSignal.set(session);
      },
      error: (error) => {
        console.error('Failed to start session', error);
      },
    });
  }

  startPhase(type: SessionPhaseType): void {
    const session = this.activeSessionSignal();

    if (!session) {
      return;
    }

    this.http.post(`/api/sessions/${session.id}/phases`, { type }).subscribe({
      next: () => {
        this.loadSessions();
      },
      error: (error) => {
        console.error('Failed to start phase', error);
      },
    });
  }

  endCurrentPhase(): void {
    const session = this.activeSessionSignal();
    const currentPhase = this.getCurrentPhase();

    if (!session || !currentPhase || currentPhase.endedAt !== null) {
      return;
    }

    this.http
      .patch(`/api/sessions/${session.id}/phases/${currentPhase.id}/end`, {})
      .subscribe({
        next: () => {
          this.loadSessions();
        },
        error: (error) => {
          console.error('Failed to end phase', error);
        },
      });
  }

  endSession(): void {
    const session = this.activeSessionSignal();

    if (!session) {
      return;
    }

    this.http.post(`/api/sessions/${session.id}/end`, {}).subscribe({
      next: () => {
        this.loadSessions();
        this.projectsService.refreshProjects();
      },
      error: (error) => {
        console.error('Failed to end session', error);
      },
    });
  }

  deleteSession(id: string): void {
    this.http.delete<void>(`/api/sessions/${id}`).subscribe({
      next: () => {
        this.loadSessions();
        this.projectsService.refreshProjects();
      },
      error: (error) => {
        console.error('Failed to delete session', error);
      },
    });
  }

  editSession(id: string, updates: Partial<ClimbingSession>) {
    return this.http.patch<void>(`/api/sessions/${id}`, updates).pipe(
      tap(() => {
        this.loadSessions();
      }),
    );
  }
}
