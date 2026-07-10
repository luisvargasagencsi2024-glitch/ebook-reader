import fs from 'fs';
import path from 'path';

const EPUB_DIR = path.resolve(import.meta.dirname, '../../epubs');

export function ensureBookFile(bookId: string, _remoteUrl: string, title: string, format: string): string {
  fs.mkdirSync(EPUB_DIR, { recursive: true });

  const ext = format === 'pdf' ? '.pdf' : '.epub';
  const localPath = path.join(EPUB_DIR, `${bookId}${ext}`);

  if (fs.existsSync(localPath)) return localPath;

  const titleSlug = title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const byTitle = path.join(EPUB_DIR, `${titleSlug}${ext}`);
  if (fs.existsSync(byTitle)) {
    fs.copyFileSync(byTitle, localPath);
    return localPath;
  }

  console.warn(`No ${ext} file found for: ${title}`);
  return localPath;
}

export function getLocalFilePath(bookId: string): string | null {
  const epub = path.join(EPUB_DIR, `${bookId}.epub`);
  if (fs.existsSync(epub)) return epub;
  const pdf = path.join(EPUB_DIR, `${bookId}.pdf`);
  if (fs.existsSync(pdf)) return pdf;
  return null;
}
