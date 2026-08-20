import { Injectable, signal, inject } from '@angular/core';
import {
  ClimbingSession,
  SessionPhase,
  SessionPhaseType,
  ProjectWork,
} from '../models/session';
import { SESSIONS } from '../data/dummy-sessions';

import { ProjectsService } from './projects.service';

@Injectable({
  providedIn: 'root',
})
export class SessionsService {
  private projectsService = inject(ProjectsService);
  constructor() {
    const storedActiveSession = localStorage.getItem('activeSession');

    if (storedActiveSession) {
      this.activeSessionSignal.set(
        JSON.parse(storedActiveSession) as ClimbingSession,
      );
    }

    const storedSessions = localStorage.getItem('sessions');

    if (storedSessions) {
      this.sessionsSignal.set(JSON.parse(storedSessions) as ClimbingSession[]);
    } else {
      this.sessionsSignal.set([...SESSIONS]);
    }
  }

  private readonly sessionsSignal = signal<ClimbingSession[]>([]);

  readonly sessions = this.sessionsSignal.asReadonly();
  private readonly activeSessionSignal = signal<ClimbingSession | null>(null);

  readonly activeSession = this.activeSessionSignal.asReadonly();

  private saveSessions(): void {
    localStorage.setItem('sessions', JSON.stringify(this.sessionsSignal()));
  }

  private saveActiveSession(): void {
    const session = this.activeSessionSignal();

    localStorage.setItem('activeSession', JSON.stringify(session));
  }

  private getCurrentPhase(): SessionPhase | null {
    const session = this.activeSessionSignal();

    if (!session) return null;

    return session.phases.at(-1) ?? null;
  }

  addProjectToCurrentPhase(projectId: number): void {
    const currentPhase = this.getCurrentPhase();
    if (currentPhase?.type !== 'project') {
      return;
    }
    currentPhase.projectWork.push({
      projectId,
      attempts: 0,
      notes: [],
    });
    this.saveActiveSession();
  }

  updateProjectAttempts(projectId: number, change: number): void {
    const currentPhase = this.getCurrentPhase();

    if (currentPhase?.type !== 'project') {
      return;
    }

    const projectWork = currentPhase.projectWork.find(
      (work) => work.projectId === projectId,
    );

    if (!projectWork) {
      return;
    }

    projectWork.attempts = Math.max(0, projectWork.attempts + change);

    this.saveActiveSession();
  }

  startSession(location: string): void {
    if (this.activeSessionSignal()) {
      return;
    }

    const newSession: ClimbingSession = {
      id: crypto.randomUUID(),
      startedAt: new Date().toISOString(),
      endedAt: null,
      location: location,
      phases: [],
      notes: [],
    };

    this.activeSessionSignal.set(newSession);

    this.saveActiveSession();
  }

  startPhase(type: SessionPhaseType, projectId?: string): void {
    const session = this.activeSessionSignal();

    if (!session) {
      return;
    }

    const timestamp = new Date().toISOString();

    const updatedPhases = session.phases.map((phase) => {
      if (phase.endedAt === null) {
        return {
          ...phase,
          endedAt: timestamp,
        };
      }

      return phase;
    });

    const newPhase: SessionPhase = {
      id: crypto.randomUUID(),
      type,
      startedAt: timestamp,
      endedAt: null,
      projectWork: [],
    };

    this.activeSessionSignal.set({
      ...session,
      phases: [...updatedPhases, newPhase],
    });
    this.saveActiveSession();
  }

  endCurrentPhase(): void {
    const session = this.activeSessionSignal();

    if (!session) {
      return;
    }

    const timestamp = new Date().toISOString();

    const updatedPhases = session.phases.map((phase) => {
      if (phase.endedAt === null) {
        return {
          ...phase,
          endedAt: timestamp,
        };
      }

      return phase;
    });

    this.activeSessionSignal.set({
      ...session,
      phases: updatedPhases,
    });
    this.saveActiveSession();
  }

  addNote(note: string): void {
    const session = this.activeSessionSignal();
    const trimmedNote = note.trim();

    if (!session || !trimmedNote) {
      return;
    }

    this.activeSessionSignal.set({
      ...session,
      notes: [...session.notes, trimmedNote],
    });
    this.saveActiveSession();
  }

  endSession(): ClimbingSession | null {
    const session = this.activeSessionSignal();

    if (!session) {
      return null;
    }

    const timestamp = new Date().toISOString();

    const completedSession: ClimbingSession = {
      ...session,
      endedAt: timestamp,
      phases: session.phases.map((phase) => {
        if (phase.endedAt === null) {
          return {
            ...phase,
            endedAt: timestamp,
          };
        }

        return phase;
      }),
    };

    const attemptsByProject = new Map<number, number>();

    for (const phase of completedSession.phases) {
      for (const work of phase.projectWork ?? []) {
        const currentAttempts = attemptsByProject.get(work.projectId) ?? 0;

        attemptsByProject.set(work.projectId, currentAttempts + work.attempts);
      }
    }

    for (const [projectId, attempts] of attemptsByProject) {
      this.projectsService.updateAttempts(projectId, attempts);
    }

    this.sessionsSignal.update((sessions) => [completedSession, ...sessions]);

    this.saveSessions();

    this.activeSessionSignal.set(null);
    localStorage.removeItem('activeSession');

    return completedSession;
  }

  deleteSession(id: string): void {
    const session = this.sessionsSignal().find((session) => session.id === id);

    if (!session) return;

    for (const phase of session.phases) {
      for (const work of phase.projectWork) {
        const amountToSubtract = -work.attempts;
        this.projectsService.updateAttempts(work.projectId, amountToSubtract);
      }
    }

    this.sessionsSignal.update((sessions) =>
      sessions.filter((session) => session.id !== id),
    );
    this.saveSessions();
  }
}
