import { useState, useEffect } from 'react';
import { api, type StatsData } from '../api/client';
import './StatsModal.css';

interface StatsModalProps {
  onClose: () => void;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m}m`;
}

export function StatsModal({ onClose }: StatsModalProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.stats.get()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="stats-overlay" onClick={onClose}>
      <div className="stats-modal" onClick={e => e.stopPropagation()}>
        <button className="stats-close" onClick={onClose}>✕</button>

        <div className="stats-body">
          <h2 className="stats-title">Estadísticas de lectura</h2>

          {loading && <p className="stats-loading">Cargando...</p>}

          {stats && (
            <div className="stats-grid">
              <div className="stats-card">
                <span className="stats-card-value">{formatMinutes(stats.totalReadingMinutes)}</span>
                <span className="stats-card-label">Tiempo total de lectura</span>
              </div>

              <div className="stats-card">
                <span className="stats-card-value">{stats.completedBooks}</span>
                <span className="stats-card-label">Libros completados</span>
              </div>

              <div className="stats-card">
                <span className="stats-card-value">{stats.totalBooks}</span>
                <span className="stats-card-label">Libros en biblioteca</span>
              </div>

              <div className="stats-card">
                <span className="stats-card-value">{stats.avgProgress}%</span>
                <span className="stats-card-label">Progreso promedio</span>
              </div>
            </div>
          )}

          {stats && stats.recentSessions.length > 0 && (
            <div className="stats-sessions">
              <h3 className="stats-sessions-title">Actividad reciente (7 días)</h3>
              {stats.recentSessions.map((s, i) => (
                <div key={i} className="stats-session">
                  <span className="stats-session-time">{formatMinutes(s.readingTimeMinutes)}</span>
                  <span className="stats-session-date">
                    {new Date(s.lastReadAt).toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
