export type SessionPhaseType =
  | 'warmup'
  | 'freeclimb'
  | 'projecting'
  | 'cooldown';

export interface SessionPhase {
  id: number;
  type: SessionPhaseType;
  startTime: string;
  endTime?: string;
}

export interface ClimbingSession {
  id: number;
  date: string;
  location: string;
  environment: 'gym' | 'outdoor';
  startTime: string;
  endTime?: string;
  phases: SessionPhase[];
  notes?: string;
}
