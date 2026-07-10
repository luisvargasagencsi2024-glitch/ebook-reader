import { Router } from 'express';
import { Note } from '../models/Note.js';
import type { AuthRequest } from '../middleware/auth.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/:bookId', async (req: AuthRequest, res) => {
  try {
    const notes = await Note.find({ userId: req.userId, bookId: req.params.bookId })
      .sort({ page: 1 })
      .lean();
    res.json(notes);
  } catch {
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const { bookId, page, location, text, content, color } = req.body;
    const note = await Note.create({
      userId: req.userId,
      bookId,
      page,
      location,
      text,
      content,
      color,
    });
    res.status(201).json(note);
  } catch {
    res.status(500).json({ error: 'Failed to create note' });
  }
});

router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { content: req.body.content, color: req.body.color, updatedAt: new Date() },
      { new: true },
    );
    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }
    res.json(note);
  } catch {
    res.status(500).json({ error: 'Failed to update note' });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

export default router;
