import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { User } from '../models/User.js';
import { Book } from '../models/Book.js';
import { Progress } from '../models/Progress.js';
import { adminMiddleware } from '../middleware/admin.js';
import type { AuthRequest } from '../middleware/auth.js';

const EPUB_DIR = path.resolve(import.meta.dirname, '../../epubs');
const router = Router();
router.use(adminMiddleware);

router.get('/users', async (_req: AuthRequest, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 }).lean();
    res.json(users.map(u => ({ id: u._id, email: u.email, name: u.name, role: u.role, active: u.active, createdAt: u.createdAt })));
  } catch {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.put('/users/:id/toggle-active', async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    user.active = !user.active;
    await user.save();
    res.json({ id: user._id, email: user.email, name: user.name, role: user.role, active: user.active });
  } catch {
    res.status(500).json({ error: 'Failed to toggle user status' });
  }
});

router.put('/users/:id/role', async (req: AuthRequest, res) => {
  try {
    const { role } = req.body;
    if (!role || !['user', 'admin'].includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, select: '-password' }
    );
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ id: user._id, email: user.email, name: user.name, role: user.role, active: user.active });
  } catch {
    res.status(500).json({ error: 'Failed to update role' });
  }
});

router.get('/books', async (_req: AuthRequest, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 }).lean();
    const progressList = await Progress.find().lean();
    const progressByBook = Object.fromEntries(
      progressList.map(p => [p.bookId.toString(), p])
    );
    const result = await Promise.all(books.map(async (b) => {
      const owner = await User.findById(b.userId).select('name email').lean();
      return {
        ...b,
        _id: b._id.toString(),
        userId: b.userId.toString(),
        ownerName: owner?.name || 'Unknown',
        ownerEmail: owner?.email || '',
        progress: progressByBook[b._id.toString()] || null,
      };
    }));
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

router.delete('/books/:id', async (req: AuthRequest, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }
    const filePath = path.join(EPUB_DIR, `${req.params.id}${path.extname(book.fileUrl || '.epub')}`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    const altPaths = ['.epub', '.pdf', '.mp3', '.m4a'];
    for (const ext of altPaths) {
      const altPath = path.join(EPUB_DIR, `${req.params.id}${ext}`);
      if (fs.existsSync(altPath)) {
        fs.unlinkSync(altPath);
      }
    }
    await Promise.all([
      Book.deleteOne({ _id: req.params.id }),
      Progress.deleteMany({ bookId: req.params.id }),
    ]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

export default router;
