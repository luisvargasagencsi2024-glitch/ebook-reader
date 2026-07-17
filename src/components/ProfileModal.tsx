import { useState } from 'react';
import { useAuth } from '../store/auth';
import './ProfileModal.css';

interface ProfileModalProps {
  onClose: () => void;
}

export function ProfileModal({ onClose }: ProfileModalProps) {
  const { user, updateProfile, changePassword } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [nameSaving, setNameSaving] = useState(false);
  const [passSaving, setPassSaving] = useState(false);
  const [nameMsg, setNameMsg] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [nameError, setNameError] = useState(false);
  const [passError, setPassError] = useState(false);

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim() === user?.name) return;
    setNameSaving(true);
    setNameMsg('');
    try {
      await updateProfile(name.trim());
      setNameMsg('Nombre actualizado');
      setNameError(false);
    } catch {
      setNameMsg('Error al actualizar nombre');
      setNameError(true);
    }
    setNameSaving(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) return;
    setPassSaving(true);
    setPassMsg('');
    try {
      await changePassword(oldPassword, newPassword);
      setPassMsg('Contraseña actualizada');
      setPassError(false);
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      setPassMsg(err instanceof Error ? err.message : 'Error al cambiar contraseña');
      setPassError(true);
    }
    setPassSaving(false);
  };

  return (
    <div className="profile-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={e => e.stopPropagation()}>
        <button className="profile-close" onClick={onClose}>✕</button>

        <div className="profile-body">
          <h2 className="profile-title">Perfil</h2>
          <p className="profile-email">{user?.email}</p>

          <form className="profile-section" onSubmit={handleNameSubmit}>
            <h3 className="profile-section-title">Nombre</h3>
            <div className="profile-field">
              <input
                className="profile-input"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Tu nombre"
              />
              <button
                className="profile-btn"
                type="submit"
                disabled={nameSaving || !name.trim() || name.trim() === user?.name}
              >
                {nameSaving ? '...' : 'Guardar'}
              </button>
            </div>
            {nameMsg && (
              <p className={`profile-msg ${nameError ? 'profile-msg--error' : 'profile-msg--ok'}`}>
                {nameMsg}
              </p>
            )}
          </form>

          <form className="profile-section" onSubmit={handlePasswordSubmit}>
            <h3 className="profile-section-title">Cambiar contraseña</h3>
            <div className="profile-field">
              <input
                className="profile-input"
                type="password"
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                placeholder="Contraseña actual"
              />
            </div>
            <div className="profile-field">
              <input
                className="profile-input"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Nueva contraseña (mín. 6 caracteres)"
              />
              <button
                className="profile-btn"
                type="submit"
                disabled={passSaving || !oldPassword || !newPassword}
              >
                {passSaving ? '...' : 'Cambiar'}
              </button>
            </div>
            {passMsg && (
              <p className={`profile-msg ${passError ? 'profile-msg--error' : 'profile-msg--ok'}`}>
                {passMsg}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
