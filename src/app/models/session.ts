export type SessionPhaseType =
  | 'warm-up'
  | 'free-climb'
  | 'project'
  | 'strength'
  | 'cardio'
  | 'other';

export interface SessionPhase {
  id: string;
  type: SessionPhaseType;
  startedAt: string;
  endedAt: string | null;
  projectId?: string;
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
