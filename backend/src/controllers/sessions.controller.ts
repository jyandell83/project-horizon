import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

import { pool } from '../db.js';

function isValidDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

export async function getSessions(req: Request, res: Response) {
  const userId = req.userId;

  if (userId === undefined) {
    return res.status(401).json({
      message: 'Authentication required',
    });
  }

  try {
    const result = await pool.query(
      `
        SELECT
          sessions.id,
          sessions.started_at AS "startedAt",
          sessions.ended_at AS "endedAt",
          sessions.location,
          sessions.environment,
          sessions.notes,
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'id', session_phases.id,
                  'type', session_phases.type,
                  'startedAt', session_phases.started_at,
                  'endedAt', session_phases.ended_at,
                  'projectWork', COALESCE(
                    (
                      SELECT json_agg(
                        json_build_object(
                          'projectId', session_project_work.project_id,
                          'attempts', session_project_work.attempts,
                          'sent', session_project_work.sent,
                          'notes', session_project_work.notes
                        )
                        ORDER BY session_project_work.id
                      )
                      FROM session_project_work
                      WHERE session_project_work.phase_id =
                        session_phases.id
                    ),
                    '[]'::json
                  )
                )
                ORDER BY session_phases.position
              )
              FROM session_phases
              WHERE session_phases.session_id = sessions.id
            ),
            '[]'::json
          ) AS phases
        FROM sessions
        WHERE sessions.user_id = $1
        ORDER BY sessions.started_at DESC
      `,
      [userId],
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error getting sessions:', error);

    return res.status(500).json({
      message: 'Failed to get sessions',
    });
  }
}

export async function createSession(req: Request, res: Response) {
  const userId = req.userId;
  const { location, environment } = req.body;

  if (userId === undefined) {
    return res.status(401).json({
      message: 'Authentication required',
    });
  }

  if (typeof location !== 'string' || !location.trim()) {
    return res.status(400).json({
      message: 'Location is required',
    });
  }

  if (
    environment !== undefined &&
    environment !== 'gym' &&
    environment !== 'outdoor'
  ) {
    return res.status(400).json({
      message: 'Environment must be gym or outdoor',
    });
  }

  try {
    const result = await pool.query(
      `
        INSERT INTO sessions (
          id,
          user_id,
          started_at,
          location,
          environment
        )
        VALUES ($1, $2, NOW(), $3, $4)
        RETURNING
          id,
          started_at AS "startedAt",
          ended_at AS "endedAt",
          location,
          environment,
          notes
      `,
      [randomUUID(), userId, location.trim(), environment ?? null],
    );

    return res.status(201).json({
      ...result.rows[0],
      phases: [],
    });
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({
        message: 'An active session already exists',
      });
    }

    console.error('Error starting session:', error);

    return res.status(500).json({
      message: 'Failed to start session',
    });
  }
}

const sessionPhaseTypes = [
  'warm-up',
  'free-climb',
  'project',
  'strength',
  'cardio',
  'other',
];

export async function createSessionPhase(req: Request, res: Response) {
  const userId = req.userId;
  const { sessionId } = req.params;
  const { type } = req.body;

  if (userId === undefined) {
    return res.status(401).json({
      message: 'Authentication required',
    });
  }

  if (!sessionPhaseTypes.includes(type)) {
    return res.status(400).json({
      message: 'Invalid session phase type',
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const sessionResult = await client.query(
      `
        SELECT id
        FROM sessions
        WHERE id = $1
          AND user_id = $2
          AND ended_at IS NULL
        FOR UPDATE
      `,
      [sessionId, userId],
    );

    if (sessionResult.rowCount === 0) {
      await client.query('ROLLBACK');

      return res.status(404).json({
        message: 'Active session not found',
      });
    }

    const timestamp = new Date().toISOString();

    await client.query(
      `
        UPDATE session_phases
        SET ended_at = $1
        WHERE session_id = $2
          AND ended_at IS NULL
      `,
      [timestamp, sessionId],
    );

    const positionResult = await client.query(
      `
        SELECT COALESCE(MAX(position), -1) + 1 AS position
        FROM session_phases
        WHERE session_id = $1
      `,
      [sessionId],
    );

    const phaseId = randomUUID();
    const position = positionResult.rows[0].position;

    await client.query(
      `
        INSERT INTO session_phases (
          id,
          session_id,
          type,
          started_at,
          position
        )
        VALUES ($1, $2, $3, $4, $5)
      `,
      [phaseId, sessionId, type, timestamp, position],
    );

    await client.query('COMMIT');

    return res.status(201).json({
      endedPreviousPhaseAt: timestamp,
      phase: {
        id: phaseId,
        type,
        startedAt: timestamp,
        endedAt: null,
        projectWork: [],
      },
    });
  } catch (error: any) {
    await client.query('ROLLBACK');

    if (error.code === '22P02') {
      return res.status(400).json({
        message: 'Invalid session ID',
      });
    }

    console.error('Error starting session phase:', error);

    return res.status(500).json({
      message: 'Failed to start session phase',
    });
  } finally {
    client.release();
  }
}

export async function addProjectToSessionPhase(req: Request, res: Response) {
  const userId = req.userId;
  const { sessionId, phaseId } = req.params;
  const { projectId } = req.body;

  if (userId === undefined) {
    return res.status(401).json({
      message: 'Authentication required',
    });
  }

  if (!Number.isInteger(projectId)) {
    return res.status(400).json({
      message: 'A valid project ID is required',
    });
  }

  try {
    const result = await pool.query(
      `
        INSERT INTO session_project_work (
          phase_id,
          project_id
        )
        SELECT
          session_phases.id,
          projects.id
        FROM session_phases
        JOIN sessions
          ON sessions.id = session_phases.session_id
        JOIN projects
          ON projects.id = $3
          AND projects.user_id = $4
        WHERE session_phases.id = $2
          AND session_phases.session_id = $1
          AND session_phases.type = 'project'
          AND session_phases.ended_at IS NULL
          AND sessions.user_id = $4
          AND sessions.ended_at IS NULL
        RETURNING
          project_id AS "projectId",
          attempts,
          sent,
          notes
      `,
      [sessionId, phaseId, projectId, userId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: 'Active project phase or project not found',
      });
    }

    return res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({
        message: 'Project is already in this phase',
      });
    }

    if (error.code === '22P02') {
      return res.status(400).json({
        message: 'Invalid session or phase ID',
      });
    }

    console.error('Error adding project to phase:', error);

    return res.status(500).json({
      message: 'Failed to add project to phase',
    });
  }
}

export async function updateSessionProjectAttempts(
  req: Request,
  res: Response,
) {
  const userId = req.userId;
  const { sessionId, phaseId, projectId } = req.params;
  const { change } = req.body;
  const numericProjectId = Number(projectId);

  if (userId === undefined) {
    return res.status(401).json({
      message: 'Authentication required',
    });
  }

  if (!Number.isInteger(numericProjectId) || (change !== 1 && change !== -1)) {
    return res.status(400).json({
      message: 'A valid project ID and attempt change are required',
    });
  }

  try {
    const result = await pool.query(
      `
        UPDATE session_project_work AS project_work
        SET attempts = GREATEST(
          0,
          project_work.attempts + $1
        )
        FROM session_phases AS phase
        JOIN sessions AS session
          ON session.id = phase.session_id
        WHERE project_work.phase_id = phase.id
          AND session.id = $2
          AND phase.id = $3
          AND project_work.project_id = $4
          AND session.user_id = $5
          AND session.ended_at IS NULL
          AND phase.ended_at IS NULL
        RETURNING
          project_work.project_id AS "projectId",
          project_work.attempts,
          project_work.sent,
          project_work.notes
      `,
      [change, sessionId, phaseId, numericProjectId, userId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: 'Active session project not found',
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '22P02') {
      return res.status(400).json({
        message: 'Invalid session or phase ID',
      });
    }

    console.error('Error updating session attempts:', error);

    return res.status(500).json({
      message: 'Failed to update session attempts',
    });
  }
}

export async function markSessionProjectSent(req: Request, res: Response) {
  const userId = req.userId;
  const { sessionId, phaseId, projectId } = req.params;
  const numericProjectId = Number(projectId);

  if (userId === undefined) {
    return res.status(401).json({
      message: 'Authentication required',
    });
  }

  if (!Number.isInteger(numericProjectId)) {
    return res.status(400).json({
      message: 'A valid project ID is required',
    });
  }

  try {
    const result = await pool.query(
      `
        UPDATE session_project_work AS project_work
        SET sent = true
        FROM session_phases AS phase
        JOIN sessions AS session
          ON session.id = phase.session_id
        WHERE project_work.phase_id = phase.id
          AND session.id = $1
          AND phase.id = $2
          AND project_work.project_id = $3
          AND session.user_id = $4
          AND session.ended_at IS NULL
          AND phase.ended_at IS NULL
        RETURNING
          project_work.project_id AS "projectId",
          project_work.attempts,
          project_work.sent,
          project_work.notes
      `,
      [sessionId, phaseId, numericProjectId, userId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: 'Active session project not found',
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '22P02') {
      return res.status(400).json({
        message: 'Invalid session or phase ID',
      });
    }

    console.error('Error marking session project sent:', error);

    return res.status(500).json({
      message: 'Failed to mark session project sent',
    });
  }
}

export async function endSessionPhase(req: Request, res: Response) {
  const userId = req.userId;
  const { sessionId, phaseId } = req.params;

  if (userId === undefined) {
    return res.status(401).json({
      message: 'Authentication required',
    });
  }

  try {
    const result = await pool.query(
      `
        UPDATE session_phases AS phase
        SET ended_at = NOW()
        FROM sessions AS session
        WHERE phase.session_id = session.id
          AND session.id = $1
          AND phase.id = $2
          AND session.user_id = $3
          AND session.ended_at IS NULL
          AND phase.ended_at IS NULL
        RETURNING
          phase.id,
          phase.type,
          phase.started_at AS "startedAt",
          phase.ended_at AS "endedAt"
      `,
      [sessionId, phaseId, userId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: 'Active session phase not found',
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '22P02') {
      return res.status(400).json({
        message: 'Invalid session or phase ID',
      });
    }

    console.error('Error ending session phase:', error);

    return res.status(500).json({
      message: 'Failed to end session phase',
    });
  }
}

export async function endSession(req: Request, res: Response) {
  const userId = req.userId;
  const { sessionId } = req.params;

  if (userId === undefined) {
    return res.status(401).json({
      message: 'Authentication required',
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const sessionResult = await client.query(
      `
        SELECT id
        FROM sessions
        WHERE id = $1
          AND user_id = $2
          AND ended_at IS NULL
        FOR UPDATE
      `,
      [sessionId, userId],
    );

    if (sessionResult.rowCount === 0) {
      await client.query('ROLLBACK');

      return res.status(404).json({
        message: 'Active session not found',
      });
    }

    const timestamp = new Date().toISOString();

    await client.query(
      `
        UPDATE session_phases
        SET ended_at = $1
        WHERE session_id = $2
          AND ended_at IS NULL
      `,
      [timestamp, sessionId],
    );

    await client.query(
      `
        WITH project_totals AS (
          SELECT
            session_project_work.project_id,
            SUM(session_project_work.attempts)::integer
              AS attempts,
            BOOL_OR(session_project_work.sent) AS sent
          FROM session_project_work
          JOIN session_phases
            ON session_phases.id =
              session_project_work.phase_id
          WHERE session_phases.session_id = $1
          GROUP BY session_project_work.project_id
        )
        UPDATE projects
        SET
          attempts =
            projects.attempts + project_totals.attempts,
          status = CASE
            WHEN project_totals.sent THEN 'sent'
            ELSE projects.status
          END
        FROM project_totals
        WHERE projects.id = project_totals.project_id
          AND projects.user_id = $2
      `,
      [sessionId, userId],
    );

    const completedResult = await client.query(
      `
        UPDATE sessions
        SET ended_at = $1
        WHERE id = $2
          AND user_id = $3
        RETURNING
          id,
          started_at AS "startedAt",
          ended_at AS "endedAt",
          location,
          environment,
          notes
      `,
      [timestamp, sessionId, userId],
    );

    await client.query('COMMIT');

    return res.status(200).json(completedResult.rows[0]);
  } catch (error: any) {
    await client.query('ROLLBACK');

    if (error.code === '22P02') {
      return res.status(400).json({
        message: 'Invalid session ID',
      });
    }

    console.error('Error ending session:', error);

    return res.status(500).json({
      message: 'Failed to end session',
    });
  } finally {
    client.release();
  }
}

export async function deleteSession(req: Request, res: Response) {
  const userId = req.userId;
  const { sessionId } = req.params;

  if (userId === undefined) {
    return res.status(401).json({
      message: 'Authentication required',
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const sessionResult = await client.query(
      `
        SELECT id
        FROM sessions
        WHERE id = $1
          AND user_id = $2
          AND ended_at IS NOT NULL
        FOR UPDATE
      `,
      [sessionId, userId],
    );

    if (sessionResult.rowCount === 0) {
      await client.query('ROLLBACK');

      return res.status(404).json({
        message: 'Completed session not found',
      });
    }

    await client.query(
      `
        WITH project_totals AS (
          SELECT
            session_project_work.project_id,
            SUM(session_project_work.attempts)::integer
              AS attempts
          FROM session_project_work
          JOIN session_phases
            ON session_phases.id =
              session_project_work.phase_id
          WHERE session_phases.session_id = $1
          GROUP BY session_project_work.project_id
        )
        UPDATE projects
        SET attempts = GREATEST(
          0,
          projects.attempts - project_totals.attempts
        )
        FROM project_totals
        WHERE projects.id = project_totals.project_id
          AND projects.user_id = $2
      `,
      [sessionId, userId],
    );

    await client.query(
      `
        DELETE FROM sessions
        WHERE id = $1
          AND user_id = $2
      `,
      [sessionId, userId],
    );

    await client.query('COMMIT');

    return res.status(204).send();
  } catch (error: any) {
    await client.query('ROLLBACK');

    if (error.code === '22P02') {
      return res.status(400).json({
        message: 'Invalid session ID',
      });
    }

    console.error('Error deleting session:', error);

    return res.status(500).json({
      message: 'Failed to delete session',
    });
  } finally {
    client.release();
  }
}

export async function updateSession(req: Request, res: Response) {
  const userId = req.userId;
  const { sessionId } = req.params;
  const { location, startedAt, endedAt, phases } = req.body;

  if (userId === undefined) {
    return res.status(401).json({
      message: 'Authentication required',
    });
  }

  if (
    typeof location !== 'string' ||
    !location.trim() ||
    !isValidDate(startedAt) ||
    !isValidDate(endedAt) ||
    new Date(startedAt) > new Date(endedAt) ||
    !Array.isArray(phases)
  ) {
    return res.status(400).json({
      message: 'Invalid session details',
    });
  }

  const sessionStart = new Date(startedAt);
  const sessionEnd = new Date(endedAt);
  const phaseIds = new Set<string>();

  for (const phase of phases) {
    if (
      typeof phase.id !== 'string' ||
      !isValidDate(phase.startedAt) ||
      !isValidDate(phase.endedAt)
    ) {
      return res.status(400).json({
        message: 'Invalid phase details',
      });
    }

    const phaseStart = new Date(phase.startedAt);
    const phaseEnd = new Date(phase.endedAt);

    if (
      phaseStart > phaseEnd ||
      phaseStart < sessionStart ||
      phaseEnd > sessionEnd ||
      phaseIds.has(phase.id)
    ) {
      return res.status(400).json({
        message: 'Invalid phase time range',
      });
    }

    phaseIds.add(phase.id);
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const sessionResult = await client.query(
      `
        SELECT id
        FROM sessions
        WHERE id = $1
          AND user_id = $2
          AND ended_at IS NOT NULL
        FOR UPDATE
      `,
      [sessionId, userId],
    );

    if (sessionResult.rowCount === 0) {
      await client.query('ROLLBACK');

      return res.status(404).json({
        message: 'Completed session not found',
      });
    }

    const phaseCountResult = await client.query(
      `
        SELECT COUNT(*)::integer AS count
        FROM session_phases
        WHERE session_id = $1
      `,
      [sessionId],
    );

    if (phaseCountResult.rows[0].count !== phases.length) {
      await client.query('ROLLBACK');

      return res.status(400).json({
        message: 'All session phases are required',
      });
    }

    await client.query(
      `
        UPDATE sessions
        SET
          location = $1,
          started_at = $2,
          ended_at = $3
        WHERE id = $4
          AND user_id = $5
      `,
      [location.trim(), startedAt, endedAt, sessionId, userId],
    );

    for (const phase of phases) {
      const phaseResult = await client.query(
        `
          UPDATE session_phases
          SET
            started_at = $1,
            ended_at = $2
          WHERE id = $3
            AND session_id = $4
        `,
        [phase.startedAt, phase.endedAt, phase.id, sessionId],
      );

      if (phaseResult.rowCount === 0) {
        throw new Error('Session phase not found');
      }
    }

    await client.query('COMMIT');

    return res.status(204).send();
  } catch (error: any) {
    await client.query('ROLLBACK');

    if (error.code === '22P02') {
      return res.status(400).json({
        message: 'Invalid session or phase ID',
      });
    }

    console.error('Error updating session:', error);

    return res.status(500).json({
      message: 'Failed to update session',
    });
  } finally {
    client.release();
  }
}
