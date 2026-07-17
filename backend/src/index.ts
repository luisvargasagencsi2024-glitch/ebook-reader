import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import bookRoutes from './routes/books.js';
import progressRoutes from './routes/progress.js';
import noteRoutes from './routes/note.js';
import highlightRoutes from './routes/highlight.js';
import bookmarkRoutes from './routes/bookmark.js';
import summaryRoutes from './routes/summary.js';
import seedRoutes from './routes/seed.js';
import webhookRoutes from './routes/webhooks.js';
import searchRoutes from './routes/search.js';
import statsRoutes from './routes/stats.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

const distDir = path.resolve(import.meta.dirname, '../../dist');
const hasStatic = fs.existsSync(distDir);

app.use(cors({ origin: hasStatic ? true : 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/highlights', highlightRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/summaries', summaryRoutes);
app.use('/api/seed', seedRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/books', searchRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

if (hasStatic) {
  app.use(express.static(distDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
