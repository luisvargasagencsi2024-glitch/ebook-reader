import { Router } from 'express';
import { Summary } from '../models/Summary.js';
import type { AuthRequest } from '../middleware/auth.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/:bookId', async (req: AuthRequest, res) => {
  try {
    const summaries = await Summary.find({
      userId: req.userId,
      bookId: req.params.bookId,
    }).sort({ createdAt: -1 });
    res.json(summaries);
  } catch {
    res.status(500).json({ error: 'Failed to fetch summaries' });
  }
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const { bookId, scope, content } = req.body;
    const summary = await Summary.create({
      userId: req.userId,
      bookId,
      scope,
      content,
    });
    res.status(201).json(summary);
  } catch {
    res.status(500).json({ error: 'Failed to save summary' });
  }
});

export default router;
