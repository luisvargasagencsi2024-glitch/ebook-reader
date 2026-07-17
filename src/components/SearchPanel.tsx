import { useState, useRef, useEffect } from 'react';
import { api, type SearchResult } from '../api/client';
import './SearchPanel.css';

interface SearchPanelProps {
  bookId: string;
  onNavigate: (href: string) => void;
  onClose: () => void;
}

export function SearchPanel({ bookId, onNavigate, onClose }: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = async () => {
    const q = query.trim();
    if (!q || q.length < 2) return;
    setSearching(true);
    setSearched(true);
    setNoResults(false);
    try {
      const res = await api.books.search(bookId, q);
      setResults(res);
      if (res.length === 0) setNoResults(true);
    } catch {
      setNoResults(true);
    }
    setSearching(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-panel" onClick={e => e.stopPropagation()}>
        <div className="search-panel__header">
          <h3 className="search-panel__title">Buscar en el libro</h3>
          <button className="search-panel__close" onClick={onClose}>✕</button>
        </div>

        <div className="search-panel__input-row">
          <input
            ref={inputRef}
            className="search-panel__input"
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu búsqueda..."
          />
          <button className="search-panel__btn" onClick={handleSearch} disabled={searching || query.trim().length < 2}>
            {searching ? '...' : 'Buscar'}
          </button>
        </div>

        {searching && (
          <div className="search-panel__status">Buscando...</div>
        )}

        {noResults && !searching && (
          <div className="search-panel__status search-panel__status--none">
            Sin resultados
          </div>
        )}

        {results.length > 0 && !searching && (
          <div className="search-panel__results">
            {results.map((r, i) => (
              <button
                key={`${r.href}-${i}`}
                className="search-panel__result"
                onClick={() => onNavigate(r.href)}
              >
                <span className="search-panel__result-chapter">{r.chapterTitle}</span>
                <span className="search-panel__result-snippet">{r.snippet}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
