import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, type BookResponse, type ProgressData } from '../api/client';
import { ReaderContainer } from '../components/ReaderContainer';
import { AudioPlayer } from '../components/AudioPlayer';

export function ReaderPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<BookResponse | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bookId) return;
    api.books.get(bookId)
      .then(setBook)
      .catch((err) => setError(err?.message || 'Error al cargar el libro'));
    api.progress.get(bookId).then(setProgress).catch(() => {});
  }, [bookId]);

  const handleProgressSave = async (data: Partial<ProgressData>) => {
    if (!bookId) return;
    try {
      const updated = await api.progress.save(bookId, data);
      setProgress(updated);
    } catch { }
  };

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
        <button onClick={() => navigate('/library')} style={{
          padding: '0.5rem 1rem', border: '1px solid var(--border)', borderRadius: 6,
          background: 'var(--surface)', color: 'var(--text)', fontSize: '0.85rem', cursor: 'pointer',
        }}>Volver a la biblioteca</button>
      </div>
    );
  }

  if (!book) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-secondary)' }}>
        Cargando...
      </div>
    );
  }

  const fileUrl = `/api/books/${bookId}/file`;

  if (book.format === 'audio') {
    return (
      <AudioPlayer
        url={fileUrl}
        title={book.title}
        bookId={bookId!}
        progress={progress}
        onProgressSave={handleProgressSave}
        onBack={() => navigate('/library')}
      />
    );
  }

  return (
    <ReaderContainer
      bookId={bookId!}
      bookFileUrl={fileUrl}
      bookFormat={book.format}
      bookTitle={book.title}
      bookAuthor={book.author}
      bookDescription={book.description}
      progress={progress}
      onProgressSave={handleProgressSave}
      onBack={() => navigate('/library')}
    />
  );
}
