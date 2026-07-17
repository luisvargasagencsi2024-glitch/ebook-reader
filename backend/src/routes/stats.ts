import { Router } from 'express';
import { Progress } from '../models/Progress.js';
import { Book } from '../models/Book.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;

    const books = await Book.find({ userId }).lean();
    const totalBooks = books.length;

    const progressDocs = await Progress.find({ userId }).lean();
    const totalReadingMinutes = progressDocs.reduce((sum, p) => sum + (p.readingTimeMinutes || 0), 0);
    const completedBooks = progressDocs.filter(p => p.progress >= 0.99).length;
    const avgProgress = totalBooks > 0
      ? progressDocs.reduce((sum, p) => sum + (p.progress || 0), 0) / totalBooks
      : 0;

    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const recentSessions = progressDocs
      .filter(p => p.lastReadAt && new Date(p.lastReadAt).getTime() > sevenDaysAgo)
      .sort((a, b) => new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime())
      .map(p => ({
        bookId: p.bookId,
        lastReadAt: p.lastReadAt,
        readingTimeMinutes: p.readingTimeMinutes || 0,
        progress: p.progress,
      }));

    res.json({
      totalBooks,
      totalReadingMinutes,
      completedBooks,
      avgProgress: Math.round(avgProgress * 100),
      recentSessions,
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
