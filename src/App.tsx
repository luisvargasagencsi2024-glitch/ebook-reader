import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { useAuth } from './store/auth';
import { Login } from './pages/Login';
import { Library } from './pages/Library';
import { ReaderPage } from './pages/ReaderPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  if (token) return <Navigate to="/library" replace />;
  return <>{children}</>;
}

function AutoLogin() {
  const { verify } = useAuth();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      const key = 'ebook-auth';
      const stored = { state: { token, user: null } };
      localStorage.setItem(key, JSON.stringify(stored));
      window.location.href = '/library';
    } else {
      window.location.href = '/';
    }
  }, [verify]);
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-secondary)' }}>Iniciando sesión...</div>;
}

function AppRoutes() {
  const { verify } = useAuth();
  useEffect(() => { verify(); }, [verify]);

  return (
    <Routes>
      <Route path="/auth" element={<AutoLogin />} />
      <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
      <Route path="/reader/:bookId" element={<ProtectedRoute><ReaderPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AppRoutes />
      </ThemeProvider>
    </BrowserRouter>
  );
}