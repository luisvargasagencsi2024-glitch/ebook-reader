import { useState, useEffect } from 'react';
import { api, type NoteData, type HighlightData, type BookmarkData } from '../api/client';
import './ReaderSidebar.css';

type Tab = 'notes' | 'highlights' | 'bookmarks';

interface ReaderSidebarProps {
  bookId: string;
  onClose: () => void;
}

export function ReaderSidebar({ bookId, onClose }: ReaderSidebarProps) {
  const [tab, setTab] = useState<Tab>('notes');
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [highlights, setHighlights] = useState<HighlightData[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkData[]>([]);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    api.notes.list(bookId).then(setNotes).catch(() => {});
    api.highlights.list(bookId).then(setHighlights).catch(() => {});
    api.bookmarks.list(bookId).then(setBookmarks).catch(() => {});
  }, [bookId]);

  const handleCreateNote = async () => {
    const text = noteText.trim();
    if (!text) return;
    try {
      await api.notes.create({ bookId, page: 0, location: '', text, content: text });
      setNoteText('');
      const updated = await api.notes.list(bookId);
      setNotes(updated);
    } catch {}
  };

  const handleDeleteNote = async (id: string) => {
    try { await api.notes.delete(id); setNotes(prev => prev.filter(n => n._id !== id)); } catch { }
  };

  const handleDeleteHighlight = async (id: string) => {
    try { await api.highlights.delete(id); setHighlights(prev => prev.filter(h => h._id !== id)); } catch { }
  };

  const handleDeleteBookmark = async (id: string) => {
    try { await api.bookmarks.delete(id); setBookmarks(prev => prev.filter(b => b._id !== id)); } catch { }
  };

  return (
    <aside className="reader-sidebar">
      <div className="reader-sidebar__header">
        <nav className="reader-sidebar__tabs">
          {(['notes', 'highlights', 'bookmarks'] as Tab[]).map(t => (
            <button key={t} className={`reader-sidebar__tab ${tab === t ? 'reader-sidebar__tab--active' : ''}`} onClick={() => setTab(t)}>
              {t === 'notes' ? 'Notas' : t === 'highlights' ? 'Resaltados' : 'Marcadores'}
            </button>
          ))}
        </nav>
        <button className="reader-sidebar__close" onClick={onClose}>✕</button>
      </div>

      <div className="reader-sidebar__content">
        {tab === 'notes' && (
          <div className="reader-sidebar__note-form">
            <textarea
              className="reader-sidebar__note-input"
              placeholder="Escribe una nota..."
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              rows={3}
            />
            <button className="reader-sidebar__note-btn" onClick={handleCreateNote} disabled={!noteText.trim()}>
              Agregar nota
            </button>
          </div>
        )}
        {tab === 'notes' && notes.length === 0 && (
          <p className="reader-sidebar__empty">Sin notas aún</p>
        )}
        {tab === 'notes' && notes.map(note => (
          <div key={note._id} className="reader-sidebar__item">
            <p className="reader-sidebar__item-text">{note.content}</p>
            <small className="reader-sidebar__item-meta">
              {new Date(note.createdAt).toLocaleDateString()}
            </small>
            <button className="reader-sidebar__item-delete" onClick={() => handleDeleteNote(note._id)}>Eliminar</button>
          </div>
        ))}

        {tab === 'highlights' && highlights.length === 0 && (
          <p className="reader-sidebar__empty">Sin resaltados aún</p>
        )}
        {tab === 'highlights' && highlights.map(h => (
          <div key={h._id} className="reader-sidebar__item reader-sidebar__item--clickable">
            <p className="reader-sidebar__item-text">"{h.text}"</p>
            <small className="reader-sidebar__item-meta">
              {new Date(h.createdAt).toLocaleDateString()}
            </small>
            <button className="reader-sidebar__item-delete" onClick={() => handleDeleteHighlight(h._id)}>Eliminar</button>
          </div>
        ))}

        {tab === 'bookmarks' && bookmarks.length === 0 && (
          <p className="reader-sidebar__empty">Sin marcadores aún</p>
        )}
        {tab === 'bookmarks' && bookmarks.map(b => (
          <div key={b._id} className="reader-sidebar__item">
            <p className="reader-sidebar__item-text">{b.label || 'Marcador'}</p>
            <small className="reader-sidebar__item-meta">
              Pág. {b.page} · {new Date(b.createdAt).toLocaleDateString()}
            </small>
            <button className="reader-sidebar__item-delete" onClick={() => handleDeleteBookmark(b._id)}>Eliminar</button>
          </div>
        ))}
      </div>
    </aside>
  );
}
