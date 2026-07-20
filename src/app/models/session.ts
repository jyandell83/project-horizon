import { ProjectNote } from './project';

export type SessionPhaseType =
  | 'warm-up'
  | 'free-climb'
  | 'project'
  | 'strength'
  | 'cardio'
  | 'other';

export interface ProjectWork {
  projectId: string;
  attempts: number;
  notes: ProjectNote[];
}

export interface SessionPhase {
  id: string;
  type: SessionPhaseType;
  startedAt: string;
  endedAt: string | null;

  projectWork: ProjectWork[];
}

export interface ClimbingSession {
  id: string;
  startedAt: string;
  endedAt: string | null;
  location?: string;
  environment?: 'gym' | 'outdoor';
  phases: SessionPhase[];
  notes: string[];
}
