import { useState, useEffect } from 'react';
import { api, type AdminUser, type AdminBook } from '../api/client';
import './AdminModal.css';

interface AdminModalProps {
  onClose: () => void;
}

type Tab = 'users' | 'books';

export function AdminModal({ onClose }: AdminModalProps) {
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [books, setBooks] = useState<AdminBook[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = () => {
    api.admin.listUsers()
      .then(setUsers)
      .catch(() => {});
  };

  const loadBooks = () => {
    api.admin.listBooks()
      .then(setBooks)
      .catch(() => {});
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([api.admin.listUsers(), api.admin.listBooks()])
      .then(([u, b]) => { setUsers(u); setBooks(b); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleActive = async (id: string) => {
    try {
      const updated = await api.admin.toggleUserActive(id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, active: updated.active } : u));
    } catch {}
  };

  const toggleRole = async (id: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      const updated = await api.admin.setUserRole(id, newRole);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role: updated.role } : u));
    } catch {}
  };

  const deleteBook = async (id: string) => {
    try {
      await api.admin.deleteBook(id);
      setBooks(prev => prev.filter(b => b._id !== id));
    } catch {}
  };

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={e => e.stopPropagation()}>
        <button className="admin-close" onClick={onClose}>✕</button>

        <div className="admin-body">
          <h2 className="admin-title">Panel de administración</h2>

          <div className="admin-tabs">
            <button
              className={`admin-tab ${tab === 'users' ? 'admin-tab--active' : ''}`}
              onClick={() => setTab('users')}
            >
              Usuarios ({users.length})
            </button>
            <button
              className={`admin-tab ${tab === 'books' ? 'admin-tab--active' : ''}`}
              onClick={() => setTab('books')}
            >
              Libros ({books.length})
            </button>
          </div>

          {loading && <p className="admin-loading">Cargando...</p>}

          {!loading && tab === 'users' && (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>{u.name}</td>
                      <td className="admin-cell-mono">{u.email}</td>
                      <td>
                        <span className={`admin-badge ${u.role === 'admin' ? 'admin-badge--admin' : ''}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-badge ${u.active ? 'admin-badge--ok' : 'admin-badge--muted'}`}>
                          {u.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="admin-cell-actions">
                        <button className="admin-btn-sm" onClick={() => toggleRole(u.id, u.role)}>
                          {u.role === 'admin' ? 'Quitar admin' : 'Hacer admin'}
                        </button>
                        <button className="admin-btn-sm" onClick={() => toggleActive(u.id)}>
                          {u.active ? 'Desactivar' : 'Activar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && tab === 'books' && (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Autor</th>
                    <th>Propietario</th>
                    <th>Formato</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map(b => (
                    <tr key={b._id}>
                      <td className="admin-cell-title">{b.title}</td>
                      <td>{b.author || '—'}</td>
                      <td className="admin-cell-mono">{b.ownerEmail}</td>
                      <td><span className="admin-badge">{b.format}</span></td>
                      <td>
                        <button className="admin-btn-sm admin-btn-sm--danger" onClick={() => deleteBook(b._id)}>
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
