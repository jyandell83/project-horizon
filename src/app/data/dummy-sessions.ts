import { ClimbingSession } from '../models/session';

export const SESSIONS: ClimbingSession[] = [
  {
    id: 'session-1',
    startedAt: '2026-06-28T18:00:00',
    endedAt: '2026-06-28T19:45:00',
    phases: [
      {
        id: 'phase-1',
        type: 'warm-up',
        startedAt: '2026-06-28T18:00:00',
        endedAt: '2026-06-28T18:15:00',
      },
      {
        id: 'phase-2',
        type: 'free-climb',
        startedAt: '2026-06-28T18:15:00',
        endedAt: '2026-06-28T18:45:00',
      },
      {
        id: 'phase-3',
        type: 'project',
        startedAt: '2026-06-28T18:45:00',
        endedAt: '2026-06-28T19:45:00',
        projectId: 'project-1',
      },
    ],
    notes: [
      'Good session.',
      'Took enough time warming up before trying hard moves.',
    ],
  },
  {
    id: 'session-2',
    startedAt: '2026-04-01T10:00:00',
    endedAt: '2026-04-01T12:30:00',
    phases: [
      {
        id: 'phase-4',
        type: 'project',
        startedAt: '2026-04-01T10:00:00',
        endedAt: '2026-04-01T12:30:00',
        projectId: 'project-2',
      },
    ],
    notes: ['Beautiful day, perfect weather for climbing.'],
  },
];
