import { useToast } from '../context/ToastContext';
import './Toast.css';

export function ToastContainer() {
  const { toasts, removeToast } = useToast();
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast--${t.type}`} onClick={() => removeToast(t.id)}>
          <span className="toast__msg">{t.message}</span>
          <button className="toast__close">✕</button>
        </div>
      ))}
    </div>
  );
}
