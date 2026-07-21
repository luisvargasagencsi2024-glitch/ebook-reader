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
  onReadingSettings?: () => void;
  onSearch?: () => void;
}

export function Toolbar({
  bookTitle,
  fileName,
  onBack,
  progress,
  pageInfo,
  showToc,
  onToggleToc,
  showSidebar,
  onToggleSidebar,
  onAiSummary,
  isFullscreen,
  onToggleFullscreen,
  onReadingSettings,
  onSearch,
  fontSize,
  onFontSizeChange,
}: ToolbarProps) {
  const { theme, toggleTheme } = useTheme();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="toolbar">
      <div className="toolbar__left">
        <button className="toolbar__btn" onClick={onBack} title="Volver">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="toolbar__title">{bookTitle || fileName}</span>
      </div>

      <div className="toolbar__center">
        <div className="toolbar__progress-info">{pageInfo}</div>
        <div className="toolbar__progress-bar">
          <div className="toolbar__progress-fill" style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }} />
        </div>
      </div>

      <div className="toolbar__right">
        <button className="toolbar__btn toolbar__btn--icon" onClick={() => onFontSizeChange(Math.max(12, fontSize - 2))} disabled={fontSize <= 12} title="Reducir fuente">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 20h16M4 4h6M12 20V4" /></svg>
        </button>
        <button className="toolbar__btn toolbar__btn--icon" onClick={() => onFontSizeChange(Math.min(32, fontSize + 2))} disabled={fontSize >= 32} title="Aumentar fuente">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 20h16M4 4h6M12 20V4" /><path d="M14 9h6" /></svg>
        </button>
        <div className="toolbar__menu-wrap">
          <button className="toolbar__btn toolbar__btn--menu" onClick={() => setShowMenu(prev => !prev)} title="Menú">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="5" r="1.5" fill="currentColor" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              <circle cx="12" cy="19" r="1.5" fill="currentColor" />
            </svg>
          </button>
          {showMenu && (
            <div className="toolbar__dropdown">
              {onToggleToc && (
                <button className={`toolbar__dropdown-item ${showToc ? 'toolbar__dropdown-item--active' : ''}`} onClick={() => { setShowMenu(false); onToggleToc(); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
                  Índice
                </button>
              )}
              {onReadingSettings && (
                <button className="toolbar__dropdown-item" onClick={() => { setShowMenu(false); onReadingSettings(); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.32 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
                  Ajustes
                </button>
              )}
              {onSearch && (
                <button className="toolbar__dropdown-item" onClick={() => { setShowMenu(false); onSearch(); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                  Buscar
                </button>
              )}
              {onToggleSidebar && (
                <button className={`toolbar__dropdown-item ${showSidebar ? 'toolbar__dropdown-item--active' : ''}`} onClick={() => { setShowMenu(false); onToggleSidebar(); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M8 12h8M8 16h5" /></svg>
                  Notas
                </button>
              )}
              {onAiSummary && (
                <button className="toolbar__dropdown-item" onClick={() => { setShowMenu(false); onAiSummary(); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a4 4 0 014 4v2a4 4 0 01-8 0V6a4 4 0 014-4z" /><path d="M20 12v1a8 8 0 01-16 0v-1" /><path d="M12 19v3" /><path d="M9 22h6" /></svg>
                  Resumen IA
                </button>
              )}
              <div className="toolbar__dropdown-divider" />
              <button className="toolbar__dropdown-item" onClick={() => { setShowMenu(false); toggleTheme(); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {theme === 'dark' ? (
                    <><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></>
                  ) : (
                    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                  )}
                </svg>
                {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              </button>
              {onToggleFullscreen && (
                <button className="toolbar__dropdown-item" onClick={() => { setShowMenu(false); onToggleFullscreen(); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {isFullscreen ? (
                      <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" />
                    ) : (
                      <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
                    )}
                  </svg>
                  {isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}