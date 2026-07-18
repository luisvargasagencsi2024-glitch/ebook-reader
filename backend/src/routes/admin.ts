import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { Book } from '../models/Book.js';
import { Progress } from '../models/Progress.js';
import { adminMiddleware } from '../middleware/admin.js';
import type { AuthRequest } from '../middleware/auth.js';

const EPUB_DIR = path.resolve(import.meta.dirname, '../../epubs');

const upload = multer({
  dest: EPUB_DIR,
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.epub', '.pdf', '.mp3', '.m4a'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos .epub, .pdf, .mp3 y .m4a'));
    }
  },
});

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

router.delete('/users/:id', async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }
    const bookCount = await Book.countDocuments({ userId: req.params.id });
    await Promise.all([
      User.deleteOne({ _id: req.params.id }),
      Book.deleteMany({ userId: req.params.id }),
      Progress.deleteMany({ userId: req.params.id }),
    ]);
    res.json({ success: true, deletedBooks: bookCount });
  } catch {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

router.post('/users', async (req: AuthRequest, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: 'name, email y password son requeridos' });
      return;
    }
    const exists = await User.findOne({ email: email.toLowerCase() }).lean();
    if (exists) {
      res.status(409).json({ error: 'El email ya está registrado' });
      return;
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashed,
      name,
      role: role === 'admin' ? 'admin' : 'user',
      active: true,
    });
    res.status(201).json({ id: user._id, email: user.email, name: user.name, role: user.role, active: user.active });
  } catch {
    res.status(500).json({ error: 'Failed to create user' });
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

router.get('/books', async (req: AuthRequest, res) => {
  try {
    const filter: Record<string, unknown> = {};
    if (req.query.userId) {
      filter.userId = req.query.userId as string;
    }
    const books = await Book.find(filter).sort({ createdAt: -1 }).lean();
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

router.post('/books/upload', upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No se envió ningún archivo' });
      return;
    }
    const { targetUserId, title, author } = req.body;
    if (!targetUserId) {
      res.status(400).json({ error: 'targetUserId es requerido' });
      return;
    }
    const targetUser = await User.findById(targetUserId).select('_id').lean();
    if (!targetUser) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }
    const ext = path.extname(req.file.originalname).toLowerCase();
    const format: 'epub' | 'pdf' | 'audio' =
      ext === '.pdf' ? 'pdf' : (ext === '.mp3' || ext === '.m4a') ? 'audio' : 'epub';
    const bookTitle = (title || path.parse(req.file.originalname).name).trim();
    const bookAuthor = (author || '').trim();

    const book = await Book.create({
      userId: targetUserId,
      title: bookTitle,
      author: bookAuthor,
      description: '',
      coverUrl: '',
      fileUrl: '',
      format,
    });

    const bookId = book._id.toString();
    const destPath = path.join(EPUB_DIR, `${bookId}${ext}`);
    fs.renameSync(req.file.path, destPath);

    await Progress.create({
      userId: targetUserId,
      bookId,
      currentPage: 1,
      totalPages: 100,
      progress: 0,
    });

    res.status(201).json({ ...book.toObject(), _id: bookId, userId: targetUserId });
  } catch (err) {
    console.error('Admin upload error:', err);
    const msg = err instanceof Error ? err.message : 'Error al subir el archivo';
    res.status(400).json({ error: msg });
  }
});

router.put('/books/:id/reassign', async (req: AuthRequest, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      res.status(400).json({ error: 'userId es requerido' });
      return;
    }
    const targetUser = await User.findById(userId).select('_id').lean();
    if (!targetUser) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }
    const book = await Book.findByIdAndUpdate(req.params.id, { userId }, { new: true });
    if (!book) {
      res.status(404).json({ error: 'Libro no encontrado' });
      return;
    }
    await Progress.updateMany({ bookId: req.params.id }, { userId });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to reassign book' });
  }
});

export default router;
