import { Router } from 'express';
import { Book } from '../models/Book.js';
import { Progress } from '../models/Progress.js';
import fs from 'fs';
import type { AuthRequest } from '../middleware/auth.js';
import { authMiddleware } from '../middleware/auth.js';
import { ensureBookFile, getLocalFilePath } from '../utils/bookFile.js';

const router = Router();

router.get('/:id/file', async (req, res) => {
  try {
    let localPath = getLocalFilePath(req.params.id);
    if (!localPath) {
      const book = await Book.findById(req.params.id).lean();
      if (!book) {
        res.status(404).json({ error: 'Book not found' });
        return;
      }
      ensureBookFile(req.params.id, book.fileUrl || '', book.title, book.format);
      localPath = getLocalFilePath(req.params.id);
    }
    if (localPath) {
      const buffer = fs.readFileSync(localPath);
      const isPdf = localPath.endsWith('.pdf');
      res.setHeader('Content-Type', isPdf ? 'application/pdf' : 'application/epub+zip');
      res.setHeader('Content-Length', buffer.length);
      res.end(buffer);
      return;
    }
    res.status(502).json({ error: 'Book file not available. Please try again later.' });
  } catch (err) {
    console.error('File proxy error:', err);
    res.status(502).json({ error: 'Could not download the book file.' });
  }
});

router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res) => {
  try {
    const books = await Book.find({ userId: req.userId }).lean();
    const progressList = await Progress.find({ userId: req.userId }).lean();
    const progressMap = Object.fromEntries(
      progressList.map((p) => [p.bookId.toString(), p]),
    );
    const result = books.map((b) => ({
      ...b,
      _id: b._id.toString(),
      userId: b.userId.toString(),
      progress: progressMap[b._id.toString()] || null,
    }));
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const book = await Book.findOne({ _id: req.params.id, userId: req.userId }).lean();
    if (!book) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }
    const progress = await Progress.findOne({
      userId: req.userId,
      bookId: book._id,
    }).lean();
    res.json({ ...book, progress: progress || null });
  } catch {
    res.status(500).json({ error: 'Failed to fetch book' });
  }
});

export default router;
