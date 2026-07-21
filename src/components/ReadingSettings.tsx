import './ReadingSettings.css';

export interface ReaderSettings {
  fontFamily: 'serif' | 'sans' | 'mono';
  lineHeight: number;
  readerTheme: 'white' | 'sepia' | 'dark';
}

interface ReadingSettingsProps {
  settings: ReaderSettings;
  onChange: (s: ReaderSettings) => void;
  onClose: () => void;
}

const STORAGE_KEY = 'ebook-reader-settings';

export function loadSettings(): ReaderSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { fontFamily: 'serif', lineHeight: 1.5, readerTheme: 'white' };
}

export function saveSettings(s: ReaderSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export function getReaderCss(settings: ReaderSettings): string {
  const fonts: Record<string, string> = {
    serif: '"Georgia", "Times New Roman", serif',
    sans: '-apple-system, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
    mono: '"SF Mono", "Fira Code", "Consolas", monospace',
  };
  const themes: Record<string, { bg: string; text: string }> = {
    white: { bg: '#ffffff', text: '#1a1a1a' },
    sepia: { bg: '#f5e6c8', text: '#3b2a14' },
    dark: { bg: '#1a1a2e', text: '#e0e0e0' },
  };
  const t = themes[settings.readerTheme];
  return `
    * {
      font-family: ${fonts[settings.fontFamily]} !important;
      line-height: ${settings.lineHeight} !important;
    }
    body {
      background: ${t.bg} !important;
      color: ${t.text} !important;
    }
  `;
}

export function ReadingSettings({ settings, onChange, onClose }: ReadingSettingsProps) {
  return (
    <div className="reading-settings__overlay" onClick={onClose}>
      <div className="reading-settings" onClick={e => e.stopPropagation()}>
        <div className="reading-settings__header">
          <h3 className="reading-settings__title">Ajustes de lectura</h3>
          <button className="reading-settings__close" onClick={onClose}>&times;</button>
        </div>

        <div className="reading-settings__body">
        <div className="reading-settings__group">
          <label className="reading-settings__label">Tipografía</label>
          <div className="reading-settings__options">
            {(['serif', 'sans', 'mono'] as const).map(f => (
              <button
                key={f}
                className={`reading-settings__option ${settings.fontFamily === f ? 'reading-settings__option--active' : ''}`}
                onClick={() => onChange({ ...settings, fontFamily: f })}
              >
                <span className={`reading-settings__preview reading-settings__preview--${f}`}>Aa</span>
                <span className="reading-settings__option-label">
                  {f === 'serif' ? 'Serif' : f === 'sans' ? 'Sans-serif' : 'Mono'}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="reading-settings__group">
          <label className="reading-settings__label">Interlineado</label>
          <div className="reading-settings__options">
            {[1.0, 1.2, 1.5, 1.8, 2.0].map(lh => (
              <button
                key={lh}
                className={`reading-settings__option ${settings.lineHeight === lh ? 'reading-settings__option--active' : ''}`}
                onClick={() => onChange({ ...settings, lineHeight: lh })}
              >
                <span className="reading-settings__preview">{lh.toFixed(1)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="reading-settings__group">
          <label className="reading-settings__label">Tema</label>
          <div className="reading-settings__options">
            {([
              { key: 'white' as const, label: 'Claro', bg: '#fff', text: '#000' },
              { key: 'sepia' as const, label: 'Sepia', bg: '#f5e6c8', text: '#3b2a14' },
              { key: 'dark' as const, label: 'Oscuro', bg: '#1a1a2e', text: '#e0e0e0' },
            ]).map(t => (
              <button
                key={t.key}
                className={`reading-settings__option ${settings.readerTheme === t.key ? 'reading-settings__option--active' : ''}`}
                onClick={() => onChange({ ...settings, readerTheme: t.key })}
              >
                <span className="reading-settings__theme-swatch" style={{ background: t.bg, color: t.text }}>
                  Aa
                </span>
                <span className="reading-settings__option-label">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
