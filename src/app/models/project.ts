export interface Project {
  id: number;
  name: string;
  grade: string;
  location: string;
  status: 'projecting' | 'sent' | 'paused';
  attempts: number;
  notes: string;
}
