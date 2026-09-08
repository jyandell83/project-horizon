import { ProjectNote } from './project';

// old data model for session phases
// export type SessionPhaseType =
//   | 'warm-up'
//   | 'free-climb'
//   | 'project'
//   | 'strength'
//   | 'cardio'
//   | 'other';

export type SessionPhaseType =
  | 'warm-up'
  | 'climbing'
  | 'project'
  | 'strength'
  | 'cardio'
  | 'flexibility'
  | 'cool-down';

export interface ProjectWork {
  projectId: number;
  attempts: number;
  sent: boolean;
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
