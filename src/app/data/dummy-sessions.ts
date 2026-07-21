import { ClimbingSession } from '../models/session';

export const SESSIONS: ClimbingSession[] = [
  {
    id: 'session-1',
    startedAt: '2026-07-19T17:00:00Z',
    endedAt: '2026-07-19T18:30:00Z',
    notes: [],
    phases: [
      {
        id: 'phase-1',
        type: 'warm-up',
        startedAt: '2026-07-19T17:00:00Z',
        endedAt: '2026-07-19T17:20:00Z',
        projectWork: [],
      },
      {
        id: 'phase-2',
        type: 'project',
        startedAt: '2026-07-19T17:20:00Z',
        endedAt: '2026-07-19T18:05:00Z',
        projectWork: [
          {
            projectId: 1,
            attempts: 6,
            notes: [
              {
                id: 1,
                date: '2026-07-19T17:35:00Z',
                body: 'Reached the crux twice.',
              },
              {
                id: 2,
                date: '2026-07-19T17:50:00Z',
                body: 'Need to trust left foot.',
              },
            ],
          },
          {
            projectId: 2,
            attempts: 2,
            notes: [
              {
                id: 3,
                date: '2026-07-19T18:00:00Z',
                body: 'Just tried a couple moves.',
              },
            ],
          },
        ],
      },
      {
        id: 'phase-3',
        type: 'strength',
        startedAt: '2026-07-19T18:05:00Z',
        endedAt: '2026-07-19T18:30:00Z',
        projectWork: [],
      },
    ],
  },
];
