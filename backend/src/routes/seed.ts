import { Router } from 'express';
import { Book } from '../models/Book.js';
import { Progress } from '../models/Progress.js';
import type { AuthRequest } from '../middleware/auth.js';
import { authMiddleware } from '../middleware/auth.js';
import { ensureBookFile } from '../utils/bookFile.js';

const router = Router();
router.use(authMiddleware);

const DEMO_BOOKS = [
  { title: 'Don Quijote de la Mancha', author: 'Miguel de Cervantes', description: 'La obra más universal de la literatura española. Las aventuras del ingenioso hidalgo don Quijote de la Mancha y su fiel escudero Sancho Panza en un viaje lleno de humor, crítica social y idealismo.', format: 'epub' as const, fileUrl: 'https://www.gutenberg.org/cache/epub/2000/pg2000.epub' },
  { title: 'El Principito', author: 'Antoine de Saint-Exupéry', description: 'Un piloto perdido en el desierto conoce a un pequeño príncipe proveniente de un asteroide. Una fábula poética sobre la amistad, el amor y lo esencial que es invisible a los ojos.', format: 'epub' as const, fileUrl: 'https://www.gutenberg.org/cache/epub/2562/pg2562.epub' },
  { title: 'Orgullo y Prejuicio', author: 'Jane Austen', description: 'Elizabeth Bennet y el señor Darcy protagonizan una de las historias de amor más célebres de la literatura. Una aguda crítica social sobre el matrimonio, la clase y las apariencias en la Inglaterra del siglo XIX.', format: 'epub' as const, fileUrl: 'https://www.gutenberg.org/cache/epub/1342/pg1342.epub' },
  { title: 'Crimen y Castigo', author: 'Fiódor Dostoyevski', description: 'Una obra maestra del realismo ruso que explora la angustia psicológica de un joven estudiante que comete un asesinato y debe enfrentar las consecuencias morales de su acto.', format: 'pdf' as const, fileUrl: '' },
  { title: 'Guerra y Paz', author: 'León Tolstói', description: 'Una epopeya histórica que narra la vida de varias familias aristocráticas rusas durante las guerras napoleónicas, entrelazando destinos individuales con el devenir de la historia.', format: 'pdf' as const, fileUrl: '' },
];

router.post('/demo', async (req: AuthRequest, res) => {
  try {
    const count = await Book.countDocuments({ userId: req.userId });
    if (count > 0) {
      res.json({ message: 'Already has books' });
      return;
    }

    for (const demo of DEMO_BOOKS) {
      const book = await Book.create({ userId: req.userId, ...demo });
      await ensureBookFile(book._id.toString(), demo.fileUrl, demo.title, demo.format);
      await Progress.create({
        userId: req.userId,
        bookId: book._id,
        currentPage: 1,
        totalPages: 100,
        progress: 0,
      });
    }

    res.json({ message: 'Demo books created' });
  } catch {
    res.status(500).json({ error: 'Failed to seed' });
  }
});

export default router;
