import type { Response, NextFunction } from 'express';
import { User } from '../models/User.js';
import { authMiddleware, type AuthRequest } from './auth.js';

export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  authMiddleware(req, res, async () => {
    try {
      const user = await User.findById(req.userId).lean();
      if (!user || user.role !== 'admin') {
        res.status(403).json({ error: 'Admin access required' });
        return;
      }
      next();
    } catch {
      res.status(500).json({ error: 'Server error' });
    }
  });
}
