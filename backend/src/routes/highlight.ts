import { Router } from 'express';
import { Highlight } from '../models/Highlight.js';
import type { AuthRequest } from '../middleware/auth.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/:bookId', async (req: AuthRequest, res) => {
  try {
    const highlights = await Highlight.find({
      userId: req.userId,
      bookId: req.params.bookId,
    })
      .sort({ page: 1 })
      .lean();
    res.json(highlights);
  } catch {
    res.status(500).json({ error: 'Failed to fetch highlights' });
  }
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const { bookId, page, location, text, color } = req.body;
    const highlight = await Highlight.create({
      userId: req.userId,
      bookId,
      page,
      location,
      text,
      color,
    });
    res.status(201).json(highlight);
  } catch {
    res.status(500).json({ error: 'Failed to create highlight' });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const highlight = await Highlight.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!highlight) {
      res.status(404).json({ error: 'Highlight not found' });
      return;
    }
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete highlight' });
  }
});

export default router;
