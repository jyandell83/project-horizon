import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({
      message: 'Authentication required',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);

    if (typeof decoded === 'string' || typeof decoded.userId !== 'number') {
      return res.status(401).json({
        message: 'Invalid or expired authentication',
      });
    }

    req.userId = decoded.userId;

    next();
  } catch {
    return res.status(401).json({
      message: 'Invalid or expired authentication',
    });
  }
}
