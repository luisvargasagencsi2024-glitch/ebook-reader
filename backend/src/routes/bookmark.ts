import { Router } from 'express';
import { Bookmark } from '../models/Bookmark.js';
import type { AuthRequest } from '../middleware/auth.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/:bookId', async (req: AuthRequest, res) => {
  try {
    const bookmarks = await Bookmark.find({
      userId: req.userId,
      bookId: req.params.bookId,
    })
      .sort({ page: 1 })
      .lean();
    res.json(bookmarks);
  } catch {
    res.status(500).json({ error: 'Failed to fetch bookmarks' });
  }
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const { bookId, page, location, label } = req.body;
    const bookmark = await Bookmark.create({
      userId: req.userId,
      bookId,
      page,
      location,
      label,
    });
    res.status(201).json(bookmark);
  } catch {
    res.status(500).json({ error: 'Failed to create bookmark' });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const bookmark = await Bookmark.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!bookmark) {
      res.status(404).json({ error: 'Bookmark not found' });
      return;
    }
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete bookmark' });
  }
});

export default router;
