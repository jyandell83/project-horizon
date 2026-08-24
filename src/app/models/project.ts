export type ProjectStatus = 'active' | 'retired' | 'sent';
export type ProjectEnvironment = 'gym' | 'outdoor';

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
  environment: ProjectEnvironment;
  status: ProjectStatus;
  attempts: number;
  notes: ProjectNote[];
}
