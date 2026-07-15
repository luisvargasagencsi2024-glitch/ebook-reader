import fs from 'fs';
import path from 'path';

const EPUB_DIR = path.resolve(import.meta.dirname, '../../epubs');

export async function ensureBookFile(bookId: string, remoteUrl: string, title: string, format: string): Promise<string> {
  fs.mkdirSync(EPUB_DIR, { recursive: true });

  const ext = format === 'pdf' ? '.pdf' : format === 'audio' ? '.mp3' : '.epub';
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

  if (remoteUrl) {
    try {
      const res = await fetch(remoteUrl);
      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(localPath, buffer);
        console.log(`Downloaded: ${remoteUrl} -> ${localPath}`);
        return localPath;
      }
      console.warn(`Failed to download ${remoteUrl}: HTTP ${res.status}`);
    } catch (err) {
      console.warn(`Error downloading ${remoteUrl}:`, err);
    }
  }

  console.warn(`No ${ext} file found for: ${title}`);
  return localPath;
}

export function getLocalFilePath(bookId: string): string | null {
  const exts = ['.epub', '.pdf', '.mp3', '.m4a'];
  for (const ext of exts) {
    const p = path.join(EPUB_DIR, `${bookId}${ext}`);
    if (fs.existsSync(p)) return p;
  }
  return null;
}