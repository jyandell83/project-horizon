export interface ProjectNote {
  id: number;
  sessionId?: number;
  date: string;
  body: string;
}

export interface Project {
  id: number;
  name: string;
  grade: string;
  location: string;
  environment: 'gym' | 'outdoor';
  status: 'active' | 'paused' | 'sent';
  attempts: number;
  notes: ProjectNote[];
}
