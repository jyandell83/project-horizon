import type { Request, Response } from 'express';

import { pool } from '../db.js';
import cloudinary from '../config/cloudinary.js';

function uploadBuffer(buffer: Buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'project-horizon/projects',
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      },
    );

    stream.end(buffer);
  });
}

export async function uploadProjectMedia(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'No image provided',
      });
    }

    const projectId = Number(req.params.id);
    const userId = req.userId;

    const projectResult = await pool.query(
      `
        SELECT id
        FROM projects
        WHERE id = $1
        AND user_id = $2
      `,
      [projectId, userId],
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        message: 'Project not found',
      });
    }

    const cloudinaryResult = await uploadBuffer(req.file.buffer);

    const result = cloudinaryResult as {
      public_id: string;
      secure_url: string;
    };

    const mediaResult = await pool.query(
      `
        INSERT INTO project_media (
          project_id,
          media_type,
          cloudinary_public_id,
          url
        )
        VALUES ($1, 'image', $2, $3)
        RETURNING *
      `,
      [projectId, result.public_id, result.secure_url],
    );

    return res.status(201).json(mediaResult.rows[0]);
  } catch (error) {
    console.error('Failed to upload project image:', error);

    return res.status(500).json({
      message: 'Failed to upload image',
    });
  }
}
