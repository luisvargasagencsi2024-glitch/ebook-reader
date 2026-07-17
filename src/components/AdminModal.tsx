import { useState, useEffect, useRef } from 'react';
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
  const [filterUserId, setFilterUserId] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFileState, setUploadFileState] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadAuthor, setUploadAuthor] = useState('');
  const [uploadTargetUser, setUploadTargetUser] = useState('');
  const [uploading, setUploading] = useState(false);
  const [reassignBookId, setReassignBookId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadBooks = (userId?: string) => {
    api.admin.listBooks(userId || undefined).then(setBooks).catch(() => {});
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([api.admin.listUsers(), api.admin.listBooks()])
      .then(([u, b]) => { setUsers(u); setBooks(b); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === 'books' && !loading) {
      loadBooks(filterUserId);
    }
  }, [filterUserId, tab, loading]);

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

  const handleUpload = async () => {
    if (!uploadFileState || !uploadTargetUser) return;
    setUploading(true);
    try {
      await api.admin.uploadBook(
        uploadFileState,
        uploadTargetUser,
        uploadTitle || undefined,
        uploadAuthor || undefined,
      );
      setShowUpload(false);
      setUploadFileState(null);
      setUploadTitle('');
      setUploadAuthor('');
      setUploadTargetUser('');
      if (fileRef.current) fileRef.current.value = '';
      loadBooks(filterUserId);
    } catch {}
    setUploading(false);
  };

  const handleReassign = async (bookId: string, newUserId: string) => {
    try {
      await api.admin.reassignBook(bookId, newUserId);
      setReassignBookId(null);
      loadBooks(filterUserId);
    } catch {}
  };

  const activeUsers = users.filter(u => u.active);

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
            <div>
              <div className="admin-books-toolbar">
                <select
                  className="admin-select"
                  value={filterUserId}
                  onChange={e => setFilterUserId(e.target.value)}
                >
                  <option value="">Todos los usuarios</option>
                  {activeUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>

                <button className="admin-btn-sm" onClick={() => setShowUpload(!showUpload)}>
                  {showUpload ? 'Cancelar' : 'Subir libro'}
                </button>
              </div>

              {showUpload && (
                <div className="admin-upload-form">
                  <h4>Subir libro a usuario</h4>
                  <div className="admin-upload-field">
                    <label>Archivo *</label>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".epub,.pdf,.mp3,.m4a"
                      onChange={e => setUploadFileState(e.target.files?.[0] || null)}
                    />
                  </div>
                  <div className="admin-upload-field">
                    <label>Usuario *</label>
                    <select
                      value={uploadTargetUser}
                      onChange={e => setUploadTargetUser(e.target.value)}
                    >
                      <option value="">Seleccionar usuario...</option>
                      {activeUsers.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                  </div>
                  <div className="admin-upload-field">
                    <label>Título</label>
                    <input
                      type="text"
                      value={uploadTitle}
                      onChange={e => setUploadTitle(e.target.value)}
                      placeholder="Nombre del archivo por defecto"
                    />
                  </div>
                  <div className="admin-upload-field">
                    <label>Autor</label>
                    <input
                      type="text"
                      value={uploadAuthor}
                      onChange={e => setUploadAuthor(e.target.value)}
                      placeholder="Opcional"
                    />
                  </div>
                  <button
                    className="admin-btn-sm"
                    onClick={handleUpload}
                    disabled={!uploadFileState || !uploadTargetUser || uploading}
                  >
                    {uploading ? 'Subiendo...' : 'Subir'}
                  </button>
                </div>
              )}

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
                        <td className="admin-cell-actions">
                          {reassignBookId === b._id ? (
                            <select
                              className="admin-select admin-select--inline"
                              value=""
                              onChange={e => {
                                if (e.target.value) handleReassign(b._id, e.target.value);
                              }}
                              onBlur={() => setReassignBookId(null)}
                              autoFocus
                            >
                              <option value="">Transferir a...</option>
                              {activeUsers.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                              ))}
                            </select>
                          ) : (
                            <button className="admin-btn-sm" onClick={() => setReassignBookId(b._id)}>
                              Transferir
                            </button>
                          )}
                          <button className="admin-btn-sm admin-btn-sm--danger" onClick={() => deleteBook(b._id)}>
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}