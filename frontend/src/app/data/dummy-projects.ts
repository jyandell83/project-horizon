import { Project } from '../models/project';

export const PROJECTS: Project[] = [
  {
    id: 1,
    name: 'Desert Rose',
    grade: 'V5',
    location: 'Joshua Tree',
    environment: 'outdoor',
    status: 'active',
    attempts: 12,
    notes: [
      {
        id: 1,
        date: '2026-06-18',
        body: 'Crux is the right-hand bump. Need better foot tension.',
      },
      {
        id: 2,
        date: '2026-06-22',
        body: 'Higher left foot helped but I still rushed the match.',
      },
      {
        id: 3,
        date: '2026-06-28',
        body: 'Almost stuck the final move. Rest longer between burns.',
      },
    ],
  },
  {
    id: 2,
    name: 'Silver Vein',
    grade: 'V4',
    location: 'Stoney Point',
    environment: 'outdoor',
    status: 'retired',
    attempts: 7,
    notes: [
      {
        id: 4,
        date: '2026-06-10',
        body: 'Really fun movement. Better when temperatures are cooler.',
      },
      {
        id: 5,
        date: '2026-06-15',
        body: 'Putting this on hold until the fall.',
      },
    ],
  },
  {
    id: 3,
    name: 'Sunset Mantle',
    grade: 'V6',
    location: 'Black Mountain',
    environment: 'outdoor',
    status: 'sent',
    attempts: 18,
    notes: [
      {
        id: 6,
        date: '2026-05-30',
        body: 'Discovered a better heel hook before the mantle.',
      },
      {
        id: 7,
        date: '2026-06-02',
        body: 'Sent! Committed to the mantle instead of hesitating.',
      },
    ],
  },
];
