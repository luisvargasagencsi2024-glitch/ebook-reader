import { Router } from 'express';
import { Progress } from '../models/Progress.js';
import type { AuthRequest } from '../middleware/auth.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.put('/:bookId', async (req: AuthRequest, res) => {
  try {
    const { currentPage, totalPages, progress, location, readingTimeMinutes } = req.body;
    const doc = await Progress.findOneAndUpdate(
      { userId: req.userId, bookId: req.params.bookId },
      {
        currentPage,
        totalPages,
        progress,
        location,
        readingTimeMinutes,
        lastReadAt: new Date(),
      },
      { upsert: true, new: true },
    );
    res.json(doc);
  } catch {
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

router.get('/:bookId', async (req: AuthRequest, res) => {
  try {
    const doc = await Progress.findOne({
      userId: req.userId,
      bookId: req.params.bookId,
    });
    res.json(doc || { currentPage: 1, totalPages: 1, progress: 0 });
  } catch {
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

export default router;
