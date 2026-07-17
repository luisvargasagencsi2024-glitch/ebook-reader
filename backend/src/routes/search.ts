import { Router } from 'express';
import path from 'path';
import AdmZip from 'adm-zip';
import { Book } from '../models/Book.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { getLocalFilePath } from '../utils/bookFile.js';

interface ManifestItem {
  id: string;
  href: string;
  mediaType: string;
}

const router = Router();

router.use(authMiddleware);

function getManifestAndSpine(zip: AdmZip): { items: ManifestItem[]; spineHrefs: string[]; opfDir: string } {
  const items: ManifestItem[] = [];
  const spineHrefs: string[] = [];
  let opfDir = '';

  const containerEntry = zip.getEntry('META-INF/container.xml');
  if (containerEntry) {
    const containerXml = containerEntry.getData().toString('utf-8');
    const opfMatch = containerXml.match(/full-path="([^"]+)"/);
    if (opfMatch) {
      const opfPath = opfMatch[1];
      opfDir = path.dirname(opfPath).replace(/\\/g, '/');
      if (opfDir !== '.') opfDir += '/';
      else opfDir = '';

      const opfEntry = zip.getEntry(opfPath);
      if (opfEntry) {
        const opfContent = opfEntry.getData().toString('utf-8');

        const manifestMatch = opfContent.match(/<manifest[^>]*>([\s\S]*?)<\/manifest>/i);
        if (manifestMatch) {
          const itemRegex = /<item\s+([^>]+)\/?>/gi;
          let itemMatch;
          while ((itemMatch = itemRegex.exec(manifestMatch[1])) !== null) {
            const attrs = itemMatch[1];
            const id = attrs.match(/id="([^"]+)"/i)?.[1] || '';
            const href = attrs.match(/href="([^"]+)"/i)?.[1] || '';
            const mediaType = attrs.match(/media-type="([^"]+)"/i)?.[1] || '';
            if (id && href) items.push({ id, href, mediaType });
          }
        }

        const spineMatch = opfContent.match(/<spine[^>]*>([\s\S]*?)<\/spine>/i);
        if (spineMatch) {
          const idrefRegex = /idref="([^"]+)"/gi;
          let idrefMatch;
          while ((idrefMatch = idrefRegex.exec(spineMatch[1])) !== null) {
            const idref = idrefMatch[1];
            const item = items.find(i => i.id === idref);
            if (item) spineHrefs.push(item.href);
          }
        }
      }
    }
  }

  return { items, spineHrefs, opfDir };
}

function getEntryName(href: string, opfDir: string): string {
  return opfDir + href;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[^;]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

router.get('/:id/search', async (req: AuthRequest, res) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string' || !q.trim()) {
      res.status(400).json({ error: 'Search query is required' });
      return;
    }
    const query = q.trim().toLowerCase();

    const bookId = req.params.id as string;
    const book = await Book.findOne({ _id: bookId, userId: req.userId }).lean();
    if (!book) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }

    const localPath = getLocalFilePath(bookId);
    if (!localPath) {
      res.status(502).json({ error: 'Book file not available' });
      return;
    }

    const zip = new AdmZip(localPath);
    const { spineHrefs, opfDir } = getManifestAndSpine(zip);

    const results: { href: string; chapterTitle: string; snippet: string }[] = [];

    for (const href of spineHrefs) {
      const entryName = getEntryName(href, opfDir);
      const entry = zip.getEntry(entryName);
      if (!entry) continue;

      const content = entry.getData().toString('utf-8');
      const text = stripHtml(content);
      const textLower = text.toLowerCase();
      const matchIdx = textLower.indexOf(query);
      if (matchIdx === -1) continue;

      const chapterTitleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
      const chapterTitle = chapterTitleMatch
        ? chapterTitleMatch[1].trim()
        : path.basename(href, path.extname(href));

      const start = Math.max(0, matchIdx - 60);
      const end = Math.min(text.length, matchIdx + query.length + 60);
      let snippet = text.slice(start, end);
      if (start > 0) snippet = '...' + snippet;
      if (end < text.length) snippet = snippet + '...';

      results.push({ href, chapterTitle, snippet });
    }

    res.json(results);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
