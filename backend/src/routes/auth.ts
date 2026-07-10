import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Book } from '../models/Book.js';
import { Progress } from '../models/Progress.js';
import { ensureBookFile } from '../utils/bookFile.js';

const router = Router();
const SECRET = process.env.JWT_SECRET || 'ebook-reader-secret-change-in-production';

async function seedDemoBooks(userId: string) {
  const count = await Book.countDocuments({ userId });
  if (count > 0) return;
  const demos = [
    { title: 'Don Quijote de la Mancha', author: 'Miguel de Cervantes', description: 'La obra más universal de la literatura española. Las aventuras del ingenioso hidalgo don Quijote de la Mancha y su fiel escudero Sancho Panza en un viaje lleno de humor, crítica social y idealismo.', format: 'epub' as const, fileUrl: 'https://www.gutenberg.org/cache/epub/2000/pg2000.epub' },
    { title: 'El Principito', author: 'Antoine de Saint-Exupéry', description: 'Un piloto perdido en el desierto conoce a un pequeño príncipe proveniente de un asteroide. Una fábula poética sobre la amistad, el amor y lo esencial que es invisible a los ojos.', format: 'epub' as const, fileUrl: 'https://www.gutenberg.org/cache/epub/2562/pg2562.epub' },
    { title: 'Orgullo y Prejuicio', author: 'Jane Austen', description: 'Elizabeth Bennet y el señor Darcy protagonizan una de las historias de amor más célebres de la literatura. Una aguda crítica social sobre el matrimonio, la clase y las apariencias en la Inglaterra del siglo XIX.', format: 'epub' as const, fileUrl: 'https://www.gutenberg.org/cache/epub/1342/pg1342.epub' },
    { title: 'Crimen y Castigo', author: 'Fiódor Dostoyevski', description: 'Una obra maestra del realismo ruso que explora la angustia psicológica de un joven estudiante que comete un asesinato y debe enfrentar las consecuencias morales de su acto.', format: 'pdf' as const, fileUrl: '' },
    { title: 'Guerra y Paz', author: 'León Tolstói', description: 'Una epopeya histórica que narra la vida de varias familias aristocráticas rusas durante las guerras napoleónicas, entrelazando destinos individuales con el devenir de la historia.', format: 'pdf' as const, fileUrl: '' },
  ];
  for (const demo of demos) {
    const book = await Book.create({ userId, ...demo });
    await ensureBookFile(book._id.toString(), demo.fileUrl, demo.title, demo.format);
    await Progress.create({
      userId,
      bookId: book._id,
      currentPage: 1,
      totalPages: 100,
      progress: 0,
    });
  }
}

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const exists = await User.findOne({ email });
    if (exists) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashed, name });
    await seedDemoBooks(user._id.toString());
    const token = jwt.sign({ userId: user._id }, SECRET, { expiresIn: '7d' });
    res.status(201).json({
      token,
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const token = jwt.sign({ userId: user._id }, SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token' });
      return;
    }
    const token = header.split(' ')[1];
    const payload = jwt.verify(token, SECRET) as { userId: string };
    const user = await User.findById(payload.userId).select('-password');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ id: user._id, email: user.email, name: user.name });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
