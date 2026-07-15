import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Book } from '../models/Book.js';
import { Progress } from '../models/Progress.js';
import { ensureBookFile } from '../utils/bookFile.js';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';
const JWT_SECRET = process.env.JWT_SECRET || 'ebook-reader-secret-change-in-production';

function webhookAuth(req: any, res: any, next: any) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || token !== WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

const router = Router();
router.use(webhookAuth);

router.post('/user-create', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      res.status(400).json({ error: 'Faltan campos: email, password, name' });
      return;
    }
    const exists = await User.findOne({ email });
    if (exists) {
      res.status(400).json({ error: 'Email ya registrado' });
      return;
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashed, name, active: true });
    res.status(201).json({ userId: user._id.toString() });
  } catch (err) {
    console.error('webhook user-create error:', err);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

router.put('/user-status', async (req, res) => {
  try {
    const { userId, active } = req.body;
    if (!userId || typeof active !== 'boolean') {
      res.status(400).json({ error: 'Faltan campos: userId, active' });
      return;
    }
    const user = await User.findByIdAndUpdate(userId, { active }, { new: true });
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }
    res.json({ userId: user._id.toString(), active: user.active });
  } catch (err) {
    console.error('webhook user-status error:', err);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

router.post('/book-purchased', async (req, res) => {
  try {
    const { email, productName, format, fileUrl, author } = req.body;
    if (!email || !productName || !format) {
      res.status(400).json({ error: 'Faltan campos: email, productName, format' });
      return;
    }
    if (!['epub', 'pdf', 'audio'].includes(format)) {
      res.status(400).json({ error: 'Formato inválido. Use: epub, pdf o audio' });
      return;
    }
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado. Cree el usuario primero.' });
      return;
    }
    const book = await Book.create({
      userId: user._id,
      title: productName,
      author: author || '',
      description: '',
      coverUrl: '',
      fileUrl: fileUrl || '',
      format,
    });
    const bookId = book._id.toString();
    if (fileUrl) {
      await ensureBookFile(bookId, fileUrl, productName, format);
    }
    await Progress.create({
      userId: user._id,
      bookId,
      currentPage: 1,
      totalPages: 100,
      progress: 0,
    });
    res.status(201).json({ bookId });
  } catch (err) {
    console.error('webhook book-purchased error:', err);
    res.status(500).json({ error: 'Error al registrar libro' });
  }
});

router.post('/generate-token', async (req, res) => {
  try {
    const { userId, email } = req.body;
    let user;
    if (userId) {
      user = await User.findById(userId);
    } else if (email) {
      user = await User.findOne({ email });
    }
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }
    if (!user.active) {
      res.status(403).json({ error: 'Usuario desactivado' });
      return;
    }
    const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, { expiresIn: '7d' });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    res.json({ token, expiresAt });
  } catch (err) {
    console.error('webhook generate-token error:', err);
    res.status(500).json({ error: 'Error al generar token' });
  }
});

export default router;