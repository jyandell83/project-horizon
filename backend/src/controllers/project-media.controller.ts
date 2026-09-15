import type { Request, Response } from 'express';
import cloudinary from '../config/cloudinary.js';

const uploadBuffer = (buffer: Buffer) => {
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
};

export const uploadProjectMedia = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        error: 'No image provided',
      });
      return;
    }

    const result = await uploadBuffer(req.file.buffer);

    res.status(201).json(result);
  } catch (error) {
    console.error('Failed to upload project image:', error);

    res.status(500).json({
      error: 'Failed to upload image',
    });
  }
};
