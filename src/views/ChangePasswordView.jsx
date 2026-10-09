import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { KeyRound, ShieldAlert, CheckCircle, ArrowRight, X, Eye, EyeOff, Lock } from 'lucide-react';
import { db } from '../services/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { hashPassword, verifyPassword } from '../utils/crypto';

export default function ChangePasswordView({ onClose }) {
  const { user, setUser, setMustChangePassword } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Show/Hide password states
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAllPasswords, setShowAllPasswords] = useState(false);

  const handleToggleShowAll = (checked) => {
    setShowAllPasswords(checked);
    setShowOldPassword(checked);
    setShowNewPassword(checked);
    setShowConfirmPassword(checked);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanOld = oldPassword.trim();
    const cleanNew = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanOld) {
      setError('Password lama / saat ini wajib diisi');
      return;
    }

    if (cleanNew.length < 6) {
      setError('Password baru minimal 6 karakter');
      return;
    }

    if (cleanNew === cleanOld) {
      setError('Password baru tidak boleh sama dengan password lama');
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setError('Konfirmasi password baru tidak cocok');
      return;
    }

    setLoading(true);
    try {
      let isOldPasswordVerified = false;
      let targetDocRef = null;

      // 1. Verifikasi kecocokan password lama ke Cloud Firestore
      if (db) {
        try {
          // Cari dokumen di Firestore: coba direct doc(user.id), fallback query username / email
          if (user?.id) {
            const directRef = doc(db, 'users', user.id);
            const snap = await getDoc(directRef);
            if (snap.exists()) {
              targetDocRef = directRef;
              const currentData = snap.data();
              const isMatch = await verifyPassword(cleanOld, currentData.password);
              if (!isMatch) {
                throw new Error('Password lama tidak sesuai. Silakan periksa kembali password Anda.');
              }
              isOldPasswordVerified = true;
            }
          }

          if (!isOldPasswordVerified && user?.username) {
            const qUser = query(collection(db, 'users'), where('username', '==', user.username.trim().toLowerCase()));
            const snapUser = await getDocs(qUser);
            if (!snapUser.empty) {
              targetDocRef = snapUser.docs[0].ref;
              const currentData = snapUser.docs[0].data();
              const isMatch = await verifyPassword(cleanOld, currentData.password);
              if (!isMatch) {
                throw new Error('Password lama tidak sesuai. Silakan periksa kembali password Anda.');
              }
              isOldPasswordVerified = true;
            }
          }

          if (!isOldPasswordVerified && user?.email) {
            const qEmail = query(collection(db, 'users'), where('email', '==', user.email.trim().toLowerCase()));
            const snapEmail = await getDocs(qEmail);
            if (!snapEmail.empty) {
              targetDocRef = snapEmail.docs[0].ref;
              const currentData = snapEmail.docs[0].data();
              const isMatch = await verifyPassword(cleanOld, currentData.password);
              if (!isMatch) {
                throw new Error('Password lama tidak sesuai. Silakan periksa kembali password Anda.');
              }
              isOldPasswordVerified = true;
            }
          }
        } catch (fErr) {
          if (fErr.message.includes('Password lama tidak sesuai')) {
            throw fErr;
          }
          console.warn('Firestore password check bypassed/offline:', fErr.message);
        }
      }

      // 2. Sinkronkan ke backend API Express (jika tersedia / jika belum diverifikasi di Firestore)
      try {
        const res = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.id,
            oldPassword: cleanOld,
            newPassword: cleanNew,
          }),
        });

        if (res.ok) {
          isOldPasswordVerified = true;
        } else {
          const text = await res.text();
          let apiData = {};
          try {
            apiData = text ? JSON.parse(text) : {};
          } catch {
            apiData = {};
          }

          // Jika backend secara spesifik menolak karena password lama salah dan belum diverifikasi Firestore
          if (res.status === 400 && apiData.error && !isOldPasswordVerified) {
            throw new Error(apiData.error);
          }
          // Jika status 500/502 (backend server offline / proxy error), jangan lemparkan pesan password salah!
          if (!isOldPasswordVerified) {
            console.warn('API backend unreachable/offline (status ' + res.status + ')');
          }
        }
      } catch (apiErr) {
        if (
          apiErr.message.includes('Password lama') ||
          apiErr.message.includes('tidak sesuai') ||
          apiErr.message.includes('wajib diisi') ||
          apiErr.message.includes('minimal')
        ) {
          throw apiErr;
        }
        console.warn('API backend offline/tidak merespons:', apiErr.message);
      }

      // Jika password lama sama sekali tidak terverifikasi baik di Firestore maupun di Backend
      if (!isOldPasswordVerified) {
        throw new Error('Password lama tidak dapat diverifikasi. Pastikan password yang Anda masukkan benar.');
      }

      // 3. Simpan password baru yang terenkripsi ke Cloud Firestore
      if (db) {
        try {
          const hashedPassword = await hashPassword(cleanNew);
          const finalDocRef = targetDocRef || (user?.id ? doc(db, 'users', user.id) : null);
          if (finalDocRef) {
            await updateDoc(finalDocRef, {
              password: hashedPassword,
              must_change_password: false,
              updated_at: new Date().toISOString(),
            });
          }
        } catch (fErr) {
          console.warn('Firestore update password error:', fErr.message);
        }
      }

      setSuccess(true);
      setTimeout(() => {
        setUser((prev) => ({ ...prev, must_change_password: false }));
        setMustChangePassword(false);
        if (onClose) onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan sistem saat memperbarui password');
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
            <div style={{ position: 'relative' }}>
              <input
                type={showOldPassword ? 'text' : 'password'}
                className="form-input"
                style={{ paddingLeft: '38px', paddingRight: '40px' }}
                placeholder="Masukkan password lama"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
              <Lock
                size={18}
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={showOldPassword ? 'Sembunyikan password' : 'Lihat password'}
              >
                {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password Baru (Min. 6 Karakter)</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNewPassword ? 'text' : 'password'}
                className="form-input"
                style={{ paddingLeft: '38px', paddingRight: '40px' }}
                placeholder="Buat password baru yang aman"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <Lock
                size={18}
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={showNewPassword ? 'Sembunyikan password' : 'Lihat password'}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Konfirmasi Password Baru</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className="form-input"
                style={{ paddingLeft: '38px', paddingRight: '40px' }}
                placeholder="Ketik ulang password baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <Lock
                size={18}
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={showConfirmPassword ? 'Sembunyikan password' : 'Lihat password'}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Menu / Opsi Tampilkan Semua Password */}
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '0.825rem',
                color: '#475569',
                userSelect: 'none',
                fontWeight: 500,
              }}
            >
              <input
                type="checkbox"
                checked={showAllPasswords}
                onChange={(e) => handleToggleShowAll(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#4f46e5' }}
              />
              <span>Tampilkan semua password</span>
            </label>
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
