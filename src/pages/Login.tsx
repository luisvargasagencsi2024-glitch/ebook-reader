import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import './Login.css';

export function Login() {
  const { login, register, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      navigate('/library');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="login-page">
      <div className="login-page__hero">
        <svg className="login-page__hero-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        </svg>
        <svg className="login-page__hero-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
          <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
        </svg>
        <svg className="login-page__hero-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>
      <div className="login-page__form-wrap">
        <form onSubmit={handleSubmit} className="login-page__form">
          <h1 className="login-page__title">
            {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </h1>
          <p className="login-page__subtitle">
            {mode === 'login' ? 'Accede a tu biblioteca digital' : 'Regístrate para comenzar a leer'}
          </p>

          {error && <div className="login-page__error">{error}</div>}

          {mode === 'register' && (
            <div className="login-page__input-group">
              <label className="login-page__label">Nombre</label>
              <input
                className="login-page__input"
                value={name} onChange={e => setName(e.target.value)} required
              />
            </div>
          )}

          <div className="login-page__input-group">
            <label className="login-page__label">Email</label>
            <input
              className="login-page__input"
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              autoComplete="email"
            />
          </div>

          <div className="login-page__input-group">
            <label className="login-page__label">Contraseña</label>
            <input
              className="login-page__input"
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          <button className="login-page__btn" type="submit" disabled={loading}>
            {loading ? 'Cargando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>

          <button
            className="login-page__btn--ghost"
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
          >
            {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
