import type { BookResponse } from '../api/client';
import './BookDetailModal.css';

interface BookDetailModalProps {
  book: BookResponse;
  coverUrl?: string;
  onStart: () => void;
  onClose: () => void;
}

export function BookDetailModal({ book, coverUrl, onStart, onClose }: BookDetailModalProps) {
  const pct = book.progress ? Math.round(book.progress.progress * 100) : 0;
  const coverImg = book.coverUrl || coverUrl;

  return (
    <div className="book-detail-overlay" onClick={onClose}>
      <div className="book-detail-modal" onClick={e => e.stopPropagation()}>
        <button className="book-detail-close" onClick={onClose}>✕</button>

        <div className="book-detail-body">
          <div className="book-detail-cover">
            {coverImg ? (
              <img src={coverImg} alt={book.title} />
            ) : (
              <div className="book-detail-cover-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                </svg>
              </div>
            )}
          </div>

          <div className="book-detail-info">
            <h2 className="book-detail-title">{book.title}</h2>
            {book.author && <p className="book-detail-author">{book.author}</p>}
            <span className="book-detail-format">
              {book.format === 'epub' ? 'EPUB' : book.format === 'pdf' ? 'PDF' : 'Audio'}
            </span>

            {book.description && (
              <p className="book-detail-description">{book.description}</p>
            )}

            <div className="book-detail-progress">
              {pct > 0 ? (
                <>
                  <div className="book-detail-progress-bar">
                    <div className="book-detail-progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="book-detail-progress-text">{pct}% {book.format === 'audio' ? 'escuchado' : 'leído'}</span>
                </>
              ) : (
                <span className="book-detail-progress-text">Nuevo</span>
              )}
            </div>

            <button className="book-detail-btn" onClick={onStart}>
              {pct > 0
                ? (book.format === 'audio' ? 'Continuar escuchando' : 'Continuar leyendo')
                : (book.format === 'audio' ? 'Comenzar a escuchar' : 'Comenzar a leer')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
