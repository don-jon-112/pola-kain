import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { KeyRound, ShieldAlert, CheckCircle, ArrowRight, X } from 'lucide-react';

export default function ChangePasswordView({ onClose }) {
  const { user, setUser, setMustChangePassword } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password baru minimal 6 karakter');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password baru tidak cocok');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          oldPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengubah password');
      }

      setSuccess(true);
      setTimeout(() => {
        setUser(data.user);
        setMustChangePassword(false);
        if (onClose) onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  const cardContent = (
    <div
      style={{
        width: '100%',
        maxWidth: '480px',
        background: '#ffffff',
        borderRadius: onClose ? '16px' : '24px',
        padding: '32px',
        boxShadow: onClose ? 'none' : '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
        position: 'relative',
      }}
    >
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px',
          }}
          title="Tutup"
        >
          <X size={20} />
        </button>
      )}

      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div
          style={{
            width: '52px',
            height: '52px',
            background: '#eef2ff',
            color: '#4f46e5',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
          }}
        >
          <KeyRound size={26} />
        </div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
          {onClose ? 'Ubah Password Akun' : 'Wajib Ganti Password'}
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '6px' }}>
          {onClose
            ? `Ubah password untuk akun ${user?.name} (@${user?.username})`
            : `Halo ${user?.name}, demi keamanan akun pada login pertama, silakan buat password baru Anda sebelum melanjutkan.`}
        </p>
      </div>

      {error && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '16px',
          }}
        >
          {error}
        </div>
      )}

      {success ? (
        <div
          style={{
            textAlign: 'center',
            padding: '20px 0',
            color: '#059669',
          }}
        >
          <CheckCircle size={44} style={{ margin: '0 auto 10px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Password Berhasil Diperbarui!</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
            {onClose ? 'Menutup jendela...' : 'Mengalihkan ke dashboard...'}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Password Lama / Saat Ini</label>
            <input
              type="password"
              className="form-input"
              placeholder="Masukkan password lama"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password Baru (Min. 6 Karakter)</label>
            <input
              type="password"
              className="form-input"
              placeholder="Buat password baru yang aman"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Konfirmasi Password Baru</label>
            <input
              type="password"
              className="form-input"
              placeholder="Ketik ulang password baru"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            {onClose && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1, padding: '10px' }}
                onClick={onClose}
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 2, padding: '10px' }}
              disabled={loading}
            >
              <span>{loading ? 'Menyimpan...' : 'Simpan Password'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
      )}
    </div>
  );

  if (onClose) {
    return (
      <div className="modal-overlay" style={{ zIndex: 9999 }}>
        {cardContent}
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
        padding: '24px',
      }}
    >
      {cardContent}
    </div>
  );
}
