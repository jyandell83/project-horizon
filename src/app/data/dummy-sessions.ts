import { ClimbingSession } from '../models/session';

export const SESSIONS: ClimbingSession[] = [
  {
    id: 1,
    date: '2026-06-28',
    location: 'Hangar 18',
    environment: 'gym',
    startTime: '2026-06-28T18:00:00',
    endTime: '2026-06-28T19:45:00',
    phases: [
      {
        id: 1,
        type: 'warmup',
        startTime: '2026-06-28T18:00:00',
        endTime: '2026-06-28T18:15:00',
      },
      {
        id: 2,
        type: 'freeclimb',
        startTime: '2026-06-28T18:15:00',
        endTime: '2026-06-28T18:45:00',
      },
      {
        id: 3,
        type: 'projecting',
        startTime: '2026-06-28T18:45:00',
        endTime: '2026-06-28T19:45:00',
      },
    ],
    notes:
      'Good session. Took enough time warming up before trying hard moves.',
  },
  {
    id: 1,
    date: '2026-04-01',
    location: 'Joshua Tree',
    environment: 'outdoor',
    startTime: '2026-06-28T18:00:00',
    endTime: '2026-06-28T19:45:00',
    phases: [
      {
        id: 4,
        type: 'projecting',
        startTime: '2026-06-28T18:45:00',
        endTime: '2026-06-28T19:45:00',
      },
    ],
    notes: 'Beautiful day, perfect weather for climbing',
  },
];
