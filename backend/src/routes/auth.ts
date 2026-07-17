import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';


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
    const user = await User.create({ email, password: hashed, name, role: 'user' });
    const token = jwt.sign({ userId: user._id }, SECRET, { expiresIn: '7d' });
    res.status(201).json({
      token,
      user: { id: user._id, email: user.email, name: user.name, role: user.role },
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
      user: { id: user._id, email: user.email, name: user.name, role: user.role },
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
    res.json({ id: user._id, email: user.email, name: user.name, role: user.role });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

router.put('/profile', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }
    const user = await User.findByIdAndUpdate(
      req.userId,
      { name: name.trim() },
      { new: true, select: '-password' }
    );
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ id: user._id, email: user.email, name: user.name, role: user.role });
  } catch {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.put('/password', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      res.status(400).json({ error: 'oldPassword and newPassword are required' });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router;
