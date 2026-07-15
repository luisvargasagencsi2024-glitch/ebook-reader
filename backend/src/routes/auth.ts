import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';


const router = Router();
const SECRET = process.env.JWT_SECRET || 'ebook-reader-secret-change-in-production';

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
    if (!user.active) {
      res.status(403).json({ error: 'Cuenta desactivada' });
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
