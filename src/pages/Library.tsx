import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { api, type BookResponse } from '../api/client';
import { BookDetailModal } from '../components/BookDetailModal';
import { ProfileModal } from '../components/ProfileModal';
import { StatsModal } from '../components/StatsModal';
import { AdminModal } from '../components/AdminModal';
import './Library.css';

const COVER_CACHE = new Map<string, string>();

async function fetchCover(title: string): Promise<string | null> {
  if (COVER_CACHE.has(title)) return COVER_CACHE.get(title) ?? null;
  try {
    const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(title)}&limit=1`);
    const data = await res.json();
    const coverId = data.docs?.[0]?.cover_i;
    if (coverId) {
      const url = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
      COVER_CACHE.set(title, url);
      return url;
    }
  } catch { }
  COVER_CACHE.set(title, '');
  return null;
}

const COVER_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
  'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
];

function getCoverGradient(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COVER_GRADIENTS[Math.abs(hash) % COVER_GRADIENTS.length];
}

function getCoverInitials(title: string): string {
  return title.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function SkeletonGrid() {
  return (
    <div className="library__loading">
      {Array.from({ length: 6 }).map((_, i) => (
        <div className="library__skeleton" key={i}>
          <div className="library__skeleton-img" />
          <div className="library__skeleton-body">
            <div className="library__skeleton-line" />
            <div className="library__skeleton-line" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Library() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState<BookResponse[]>([]);
  const [covers, setCovers] = useState<Record<string, string>>({});
  const [selectedBook, setSelectedBook] = useState<BookResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'epub' | 'pdf' | 'audio'>('all');
  const [showProfile, setShowProfile] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadBooks = () => {
    setLoading(true);
    api.books.list()
      .then(list => {
        setBooks(list);
        list.forEach(book => {
          if (!book.coverUrl) {
            fetchCover(book.title).then(url => {
              if (url) {
                setCovers(prev => ({ ...prev, [book._id]: url }));
                api.books.updateCover(book._id, url).catch(() => {});
              }
            });
          }
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(loadBooks, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await api.books.upload(file);
      loadBooks();
    } catch {}
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetch('/api/seed/demo', { method: 'POST', headers: { Authorization: `Bearer ${useAuth.getState().token}` } });
      const data = await res.json();
      if (data.message) loadBooks();
    } catch { }
    setSeeding(false);
  };

  return (
    <div className="library">
      <header className="library__header">
        <h1 className="library__title">Mi Biblioteca</h1>
        <div className="library__header-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept=".epub,.pdf,.mp3,.m4a"
            onChange={handleUpload}
            style={{ display: 'none' }}
          />
          <button className="library__btn" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? '...' : 'Subir archivo'}
          </button>
          <button className="library__btn" onClick={handleSeed} disabled={seeding}>
            {seeding ? '...' : 'Agregar demo'}
          </button>
          <button className="library__btn" onClick={() => setShowStats(true)}>
            Estadísticas
          </button>
          {user?.role === 'admin' && (
            <button className="library__btn" onClick={() => setShowAdmin(true)}>
              Admin
            </button>
          )}
          <button className="library__btn library__btn--profile" onClick={() => setShowProfile(true)}>
            Perfil
          </button>
          <span className="library__user-name">{user?.name}</span>
          <button className="library__btn" onClick={() => { logout(); navigate('/'); }}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="library__main">
        {loading && <SkeletonGrid />}

        {!loading && books.length === 0 && (
          <div className="library__empty">
            <svg className="library__empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
            <p className="library__empty-title">No tienes libros en tu biblioteca</p>
            <p className="library__empty-text">Tus libros aparecerán aquí automáticamente.</p>
            <button className="library__btn" onClick={handleSeed} disabled={seeding}>
              {seeding ? 'Agregando...' : 'Agregar libros de demostración'}
            </button>
          </div>
        )}

        {!loading && books.length > 0 && (
          <>
          <div className="library__filter">
            {(['all', 'epub', 'pdf', 'audio'] as const).map(f => (
              <button
                key={f}
                className={`library__filter-btn ${filter === f ? 'library__filter-btn--active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'Todos' : f === 'epub' ? 'EPUB' : f === 'pdf' ? 'PDF' : 'Audio'}
              </button>
            ))}
          </div>
          <div className="library__grid">
            {books.filter(b => filter === 'all' || b.format === filter).map((book, index) => {
              const pct = book.progress ? Math.round(book.progress.progress * 100) : 0;
              const coverSrc = book.coverUrl || covers[book._id];
              return (
                <div
                  key={book._id}
                  className="library__card"
                  onClick={() => setSelectedBook(book)}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="library__card-cover">
                    {coverSrc ? (
                      <img src={coverSrc} alt={book.title} />
                    ) : (
                      <div
                        className="library__card-cover--gradient"
                        style={{ background: getCoverGradient(book.title) }}
                      >
                        {getCoverInitials(book.title)}
                      </div>
                    )}
                    <span className="library__card-format">{book.format}</span>
                  </div>
                  <div className="library__card-body">
                    <h3 className="library__card-title" title={book.title}>{book.title}</h3>
                    {book.author && (
                      <p className="library__card-author">{book.author}</p>
                    )}
                    {pct > 0 ? (
                      <div>
                        <div className="library__card-progress-bar">
                          <div className="library__card-progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="library__card-progress-text">{pct}% {book.format === 'audio' ? 'escuchado' : 'leído'}</p>
                      </div>
                    ) : (
                      <p className="library__card-action">
                        {book.progress ? (book.format === 'audio' ? 'Continuar escuchando →' : 'Continuar leyendo →') : (book.format === 'audio' ? 'Comenzar a escuchar →' : 'Comenzar a leer →')}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          </>
        )}
      </main>

      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          coverUrl={covers[selectedBook._id]}
          onStart={() => { setSelectedBook(null); navigate(`/reader/${selectedBook._id}`); }}
          onClose={() => setSelectedBook(null)}
        />
      )}

      {showProfile && (
        <ProfileModal onClose={() => setShowProfile(false)} />
      )}

      {showStats && (
        <StatsModal onClose={() => setShowStats(false)} />
      )}

      {showAdmin && (
        <AdminModal onClose={() => setShowAdmin(false)} />
      )}
    </div>
  );
}
