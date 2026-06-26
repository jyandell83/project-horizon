import { Project } from '../models/project';

export const PROJECTS: Project[] = [
  {
    id: 1,
    name: 'Desert Rose',
    grade: 'V5',
    location: 'Joshua Tree',
    status: 'projecting',
    attempts: 12,
    notes: 'Crux is the right-hand bump. Need better foot tension.',
  },
  {
    id: 2,
    name: 'Silver Vein',
    grade: 'V4',
    location: 'Stoney Point',
    status: 'paused',
    attempts: 7,
    notes: 'Good movement, but skin dependent.',
  },
  {
    id: 3,
    name: 'Sunset Mantle',
    grade: 'V6',
    location: 'Black Mountain',
    status: 'sent',
    attempts: 18,
    notes: 'Sent after changing beta on the last move.',
  },
];
