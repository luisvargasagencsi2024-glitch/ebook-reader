import './AiSummaryModal.css';

interface AiSummaryModalProps {
  title: string;
  onClose: () => void;
}

export function AiSummaryModal({ title, onClose }: AiSummaryModalProps) {
  return (
    <div className="ai-summary-overlay" onClick={onClose}>
      <div className="ai-summary-modal" onClick={e => e.stopPropagation()}>
        <div className="ai-summary-modal__header">
          <h3>Resumen IA: {title}</h3>
          <button className="ai-summary-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="ai-summary-modal__content">
          <p>
            Este es un resumen generado por inteligencia artificial del libro <strong>"{title}"</strong>.
          </p>
          <p>
            La IA analizaría el contenido completo del libro y generaría un resumen
            estructurado con los puntos clave, personajes principales, trama y conclusiones.
          </p>
          <p>
            Esta funcionalidad estará disponible próximamente.
          </p>
          <div className="ai-summary-modal__placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2a4 4 0 014 4v2a4 4 0 01-8 0V6a4 4 0 014-4z" />
              <path d="M20 12v1a8 8 0 01-16 0v-1" />
              <path d="M12 19v3" />
              <path d="M9 22h6" />
            </svg>
            <p>Próximamente</p>
          </div>
        </div>
      </div>
    </div>
  );
}
