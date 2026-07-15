import { Injectable, signal } from '@angular/core';
import {
  ClimbingSession,
  SessionPhase,
  SessionPhaseType,
} from '../models/session';

@Injectable({
  providedIn: 'root',
})
export class SessionsService {
  constructor() {
    const storedSession = localStorage.getItem('activeSession');

    if (storedSession) {
      this.activeSessionSignal.set(
        JSON.parse(storedSession) as ClimbingSession,
      );
    }
  }
  private readonly activeSessionSignal = signal<ClimbingSession | null>(null);

  readonly activeSession = this.activeSessionSignal.asReadonly();

  private saveActiveSession(): void {
    const session = this.activeSessionSignal();

    localStorage.setItem('activeSession', JSON.stringify(session));
  }

  startSession(): void {
    if (this.activeSessionSignal()) {
      return;
    }

    const newSession: ClimbingSession = {
      id: crypto.randomUUID(),
      startedAt: new Date().toISOString(),
      endedAt: null,
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
      projectId,
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

    this.activeSessionSignal.set(null);
    localStorage.removeItem('activeSession');

    return completedSession;
  }
}
