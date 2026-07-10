import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import type { BookFormat } from '../types';
import './Toolbar.css';

interface ToolbarProps {
  fileName: string;
  format: BookFormat | null;
  bookTitle?: string;
  bookAuthor?: string;
  bookDescription?: string;
  onBack: () => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onFitWidth?: () => void;
  onFitPage?: () => void;
  progress: number;
  pageInfo: string;
  showToc?: boolean;
  onToggleToc?: () => void;
  showSidebar?: boolean;
  onToggleSidebar?: () => void;
  onAiSummary?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export function Toolbar({
  fileName,
  format,
  bookTitle,
  bookAuthor,
  bookDescription,
  onBack,
  fontSize,
  onFontSizeChange,
  zoom,
  onZoomChange,
  onFitWidth,
  onFitPage,
  progress,
  pageInfo,
  showToc,
  onToggleToc,
  showSidebar,
  onToggleSidebar,
  onAiSummary,
  isFullscreen,
  onToggleFullscreen,
}: ToolbarProps) {
  const { theme, toggleTheme } = useTheme();
  const [showInfo, setShowInfo] = useState(false);

  return (
    <header className="toolbar">
      <div className="toolbar__left">
        <button className="toolbar__btn" onClick={onBack} title="Volver">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="toolbar__book-meta">
          <span className="toolbar__title">{bookTitle || fileName}</span>
          {bookAuthor && <span className="toolbar__author">{bookAuthor}</span>}
        </div>
        {format && <span className="toolbar__format">{format === 'epub' ? 'EPUB' : 'PDF'}</span>}
      </div>

      <div className="toolbar__center">
        {format === 'epub' && (
          <>
            <button className="toolbar__btn" onClick={() => onFontSizeChange(Math.max(12, fontSize - 2))} disabled={fontSize <= 12} title="Reducir fuente">A<sup>−</sup></button>
            <span className="toolbar__value">{fontSize}px</span>
            <button className="toolbar__btn" onClick={() => onFontSizeChange(Math.min(32, fontSize + 2))} disabled={fontSize >= 32} title="Aumentar fuente">A<sup>+</sup></button>
            {onToggleToc && (
              <button className={`toolbar__btn ${showToc ? 'toolbar__btn--active' : ''}`} onClick={onToggleToc} title="Índice">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
          </>
        )}
        {format === 'pdf' && (
          <>
            <button className="toolbar__btn" onClick={() => onZoomChange(Math.max(0.3, zoom - 0.25))} disabled={zoom <= 0.3} title="Alejar">−</button>
            <span className="toolbar__value">{Math.round(zoom * 100)}%</span>
            <button className="toolbar__btn" onClick={() => onZoomChange(Math.min(4, zoom + 0.25))} disabled={zoom >= 4} title="Acercar">+</button>
            {onFitPage && <button className="toolbar__btn" onClick={onFitPage} title="Ajustar a la pantalla">⊡</button>}
            {onFitWidth && <button className="toolbar__btn" onClick={onFitWidth} title="Ajustar al ancho">⇔</button>}
          </>
        )}
      </div>

      <div className="toolbar__right">
        <div className="toolbar__progress" title="Progreso">
          <span>{pageInfo}</span>
          <div className="toolbar__progress-bar">
            <div className="toolbar__progress-fill" style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }} />
          </div>
        </div>

        {bookDescription && (
          <div className="toolbar__info-wrap">
            <button className="toolbar__btn" onClick={() => setShowInfo(prev => !prev)} title="Información del libro">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
            </button>
            {showInfo && (
              <div className="toolbar__info-dropdown">
                <p className="toolbar__info-text">{bookDescription}</p>
              </div>
            )}
          </div>
        )}

        {onToggleSidebar && (
          <button className={`toolbar__btn ${showSidebar ? 'toolbar__btn--active' : ''}`} onClick={onToggleSidebar} title="Notas y marcadores">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" />
              <path d="M8 12h8M8 16h5" />
            </svg>
          </button>
        )}
        {onToggleFullscreen && (
          <button className="toolbar__btn" onClick={onToggleFullscreen} title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}>
            {isFullscreen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
              </svg>
            )}
          </button>
        )}

        {onAiSummary && (
          <button className="toolbar__btn" onClick={onAiSummary} title="Resumen IA">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a4 4 0 014 4v2a4 4 0 01-8 0V6a4 4 0 014-4z" />
              <path d="M20 12v1a8 8 0 01-16 0v-1" />
              <path d="M12 19v3" />
              <path d="M9 22h6" />
            </svg>
          </button>
        )}
        <button className="toolbar__btn" onClick={toggleTheme} title="Modo oscuro/claro">
          {theme === 'dark' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
