import type { Request, Response } from 'express';
import type { UploadApiResponse } from 'cloudinary';

import { pool } from '../db.js';
import cloudinary from '../config/cloudinary.js';

function uploadBuffer(buffer: Buffer): Promise<UploadApiResponse> {
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

        if (!result) {
          reject(new Error('Cloudinary returned no upload result'));
          return;
        }

        resolve(result);
      },
    );

    stream.end(buffer);
  });
}

export async function uploadProjectMedia(req: Request, res: Response) {
  let uploadedPublicId: string | null = null;

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

    uploadedPublicId = cloudinaryResult.public_id;

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
      [projectId, cloudinaryResult.public_id, cloudinaryResult.secure_url],
    );

    return res.status(201).json(mediaResult.rows[0]);
  } catch (error) {
    if (uploadedPublicId) {
      try {
        await cloudinary.uploader.destroy(uploadedPublicId);
      } catch (cleanupError) {
        console.error('Failed to clean up Cloudinary asset:', cleanupError);
      }
    }

    console.error('Failed to upload project image:', error);

    return res.status(500).json({
      message: 'Failed to upload image',
    });
  }
}

export async function deleteProjectMedia(req: Request, res: Response) {
  try {
    const projectId = Number(req.params.projectId);
    const mediaId = Number(req.params.mediaId);
    const userId = req.userId;

    const mediaResult = await pool.query(
      `
        SELECT project_media.*
        FROM project_media
        JOIN projects
          ON project_media.project_id = projects.id
        WHERE project_media.id = $1
        AND project_media.project_id = $2
        AND projects.user_id = $3
      `,
      [mediaId, projectId, userId],
    );

    if (mediaResult.rows.length === 0) {
      return res.status(404).json({
        message: 'Media not found',
      });
    }

    const media = mediaResult.rows[0];

    const cloudinaryResult = await cloudinary.uploader.destroy(
      media.cloudinary_public_id,
      {
        resource_type: 'image',
        invalidate: true,
      },
    );

    if (cloudinaryResult.result !== 'ok') {
      console.error('Cloudinary failed to delete asset:', cloudinaryResult);

      return res.status(500).json({
        message: 'Failed to delete media from Cloudinary',
      });
    }

    await pool.query(
      `
        DELETE FROM project_media
        WHERE id = $1
        AND project_id = $2
      `,
      [mediaId, projectId],
    );

    return res.status(204).send();
  } catch (error) {
    console.error('Failed to delete project media:', error);

    return res.status(500).json({
      message: 'Failed to delete media',
    });
  }
}
