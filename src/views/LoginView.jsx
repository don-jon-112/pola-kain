import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Scissors,
  Lock,
  User,
  ArrowRight,
  Shield,
  CheckCircle,
  Eye,
  EyeOff,
  Sparkles,
  X,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { APP_VERSION, APP_BUILD_DATE, CHANGELOG_DATA } from '../config/version';

export default function LoginView() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showChangelog, setShowChangelog] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      let msg = err.message || 'Gagal login ke sistem';
      if (msg.includes('JSON.parse') || msg.includes('unexpected end of data')) {
        msg = 'Gagal menghubungi server. Silakan coba kembali atau periksa koneksi Anda.';
      } else if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        msg = 'Koneksi internet bermasalah. Pastikan perangkat Anda terhubung ke internet.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          background: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
        }}
      >
        {/* Brand Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            padding: '36px 32px 30px',
            color: '#ffffff',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          {/* Version Pill Header */}
          <div
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(6px)',
              padding: '3px 10px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
            }}
            onClick={() => setShowChangelog(true)}
            title="Klik untuk melihat Catatan Rilis"
          >
            <span>v{APP_VERSION}</span>
            <span style={{ fontSize: '0.65rem', background: '#10b981', color: '#fff', padding: '1px 5px', borderRadius: '10px' }}>
              PROD
            </span>
          </div>

          <div
            style={{
              width: '56px',
              height: '56px',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(8px)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Scissors size={28} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            POLAKAIN
          </h2>
          <p style={{ fontSize: '0.875rem', opacity: 0.9, marginTop: '4px' }}>
            Integrated Garment & Uniform Management System
          </p>
        </div>

        {/* Form Body */}
        <div style={{ padding: '32px' }}>
          {error && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                marginBottom: '20px',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username atau Email</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="Masukkan username atau email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <User
                  size={18}
                  style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingLeft: '38px', paddingRight: '40px' }}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Lock
                  size={18}
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
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
                  title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div style={{ marginTop: '8px' }}>
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '0.825rem',
                    color: '#64748b',
                    userSelect: 'none',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                    style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: '#4f46e5' }}
                  />
                  <span>Tampilkan Password</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', marginTop: '8px', fontSize: '0.95rem' }}
              disabled={loading}
            >
              <span>{loading ? 'Memproses Masuk...' : 'Masuk ke Sistem'}</span>
              <ArrowRight size={18} />
            </button>
          </form>

          {/* Footer Version & Changelog Link */}
          <div
            style={{
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.775rem',
              color: '#64748b',
            }}
          >
            <div>
              <strong>PolaKain</strong> &bull; Versi {APP_VERSION} ({APP_BUILD_DATE})
            </div>
            <button
              type="button"
              onClick={() => setShowChangelog(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#4f46e5',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '6px',
              }}
            >
              <Sparkles size={13} />
              <span>Lihat Catatan Rilis & Changelog</span>
            </button>
          </div>
        </div>
      </div>

      {/* Changelog Modal */}
      {showChangelog && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{ maxWidth: '580px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    background: '#eef2ff',
                    color: '#4f46e5',
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Sparkles size={20} />
                </div>
                <div>
                  <div className="modal-title">Catatan Rilis (Changelog)</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Riwayat pembaruan & versi aplikasi PolaKain
                  </div>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowChangelog(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ overflowY: 'auto', padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {CHANGELOG_DATA.map((rel) => (
                  <div
                    key={rel.version}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '16px',
                      background: rel.badge === 'Latest' ? '#fcfdff' : '#ffffff',
                      boxShadow: rel.badge === 'Latest' ? '0 2px 8px rgba(79, 70, 229, 0.08)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e293b' }}>
                          v{rel.version}
                        </span>
                        {rel.badge && (
                          <span
                            style={{
                              background: rel.badge === 'Latest' ? '#dcfce7' : '#f1f5f9',
                              color: rel.badge === 'Latest' ? '#15803d' : '#475569',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '20px',
                            }}
                          >
                            {rel.badge}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#94a3b8' }}>
                        <Calendar size={13} />
                        <span>{rel.date}</span>
                      </div>
                    </div>

                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#334155', marginBottom: '10px' }}>
                      {rel.title}
                    </div>

                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.825rem', color: '#475569', lineHeight: '1.6' }}>
                      {rel.changes.map((ch, idx) => (
                        <li key={idx} style={{ marginBottom: '4px' }}>
                          {ch}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid #f1f5f9' }}>
              <button className="btn btn-primary btn-sm" onClick={() => setShowChangelog(false)}>
                Tutup Catatan Rilis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
