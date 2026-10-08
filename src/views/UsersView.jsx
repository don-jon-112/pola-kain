import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  KeyRound,
  Shield,
  CheckCircle2,
  XCircle,
  X,
  AlertCircle,
  Copy,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function UsersView() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createdResult, setCreatedResult] = useState(null);

  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('CUSTOMER');
  const [customerId, setCustomerId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Custom password states
  const [selectedUserForPassword, setSelectedUserForPassword] = useState(null);
  const [customPasswordInput, setCustomPasswordInput] = useState('');
  const [customPasswordLoading, setCustomPasswordLoading] = useState(false);
  const [customPasswordError, setCustomPasswordError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [uRes, cRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/customers'),
      ]);
      const [uData, cData] = await Promise.all([uRes.json(), cRes.json()]);
      setUsers(uData);
      setCustomers(cData);
      if (cData.length > 0) setCustomerId(cData[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          email,
          name,
          role,
          customer_id: role === 'CUSTOMER' ? customerId : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal membuat user');
      }

      setCreatedResult({
        username: data.user.username,
        initialPassword: data.generatedPassword,
      });

      setUsername('');
      setEmail('');
      setName('');
      fetchData();
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (userId) => {
    if (!window.confirm('Reset password untuk akun ini? User akan diwajibkan ganti password saat login berikutnya.')) return;
    try {
      const res = await fetch(`/api/users/${userId}/reset-password`, { method: 'PUT' });
      const data = await res.json();
      if (res.ok) {
        alert(`Password berhasil di-reset!\nPassword baru sementara: ${data.temporaryPassword}`);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetCustomPassword = async (e) => {
    e.preventDefault();
    if (!selectedUserForPassword) return;
    setCustomPasswordError('');
    if (customPasswordInput.length < 6) {
      setCustomPasswordError('Password baru minimal 6 karakter');
      return;
    }
    setCustomPasswordLoading(true);
    try {
      const res = await fetch(`/api/users/${selectedUserForPassword.id}/set-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: customPasswordInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengubah password');
      alert(`Password untuk ${selectedUserForPassword.name} (@${selectedUserForPassword.username}) berhasil diperbarui!`);
      setSelectedUserForPassword(null);
      setCustomPasswordInput('');
      fetchData();
    } catch (err) {
      setCustomPasswordError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setCustomPasswordLoading(false);
    }
  };

  const handleToggleActive = async (userId) => {
    try {
      const res = await fetch(`/api/users/${userId}/toggle-active`, { method: 'PUT' });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="content-body">
      <div className="card">
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              Manajemen Pengguna & Hak Akses Akun
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Super Admin dapat membuat akun baru dengan initial password dan fitur wajib ganti password di login pertama.
            </p>
          </div>

          <button className="btn btn-primary btn-sm" onClick={() => { setCreatedResult(null); setShowCreateModal(true); }}>
            <Plus size={16} />
            <span>Buat Akun Baru</span>
          </button>
        </div>

        {/* Users Table */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Memuat data pengguna...</div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="desktop-only-table">
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Nama Pengguna</th>
                      <th>Username / Email</th>
                      <th>Role Akses</th>
                      <th>Status Password Pertama</th>
                      <th>Status Akun</th>
                      <th className="text-center" style={{ width: '180px' }}>
                        Aksi Admin
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} style={{ opacity: u.active ? 1 : 0.6 }}>
                        <td>
                          <div style={{ fontWeight: 700 }}>{u.name}</div>
                          <div className="font-mono" style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            ID: {u.id}
                          </div>
                        </td>
                        <td>
                          <div className="font-mono" style={{ fontWeight: 600 }}>{u.username}</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{u.email}</div>
                        </td>
                        <td>
                          <span className={`user-role-badge role-${u.role}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>
                          {u.must_change_password ? (
                            <span className="badge badge-REQUESTED" title="User harus ganti password saat login">
                              Wajib Ganti Password 🔒
                            </span>
                          ) : (
                            <span className="badge badge-COMPLETED">
                              Sudah Diperbarui ✓
                            </span>
                          )}
                        </td>
                        <td>
                          {u.active ? (
                            <span className="badge badge-COMPLETED">Aktif</span>
                          ) : (
                            <span className="badge badge-REJECTED">Dinonaktifkan</span>
                          )}
                        </td>
                        <td className="text-center">
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              className="btn btn-primary btn-sm"
                              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                              title="Atur Password Baru Secara Manual"
                              onClick={() => {
                                setSelectedUserForPassword(u);
                                setCustomPasswordInput('');
                                setCustomPasswordError('');
                              }}
                            >
                              <KeyRound size={13} />
                              <span>Set Password</span>
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                              title="Reset Password Pengguna Acak"
                              onClick={() => handleResetPassword(u.id)}
                            >
                              <span>Reset</span>
                            </button>
                            <button
                              className="btn btn-secondary btn-sm btn-icon"
                              style={{ color: u.active ? '#ef4444' : '#10b981' }}
                              title={u.active ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                              onClick={() => handleToggleActive(u.id)}
                            >
                              {u.active ? <XCircle size={15} /> : <CheckCircle2 size={15} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards View */}
            <div className="mobile-only-cards">
              {users.map((u) => (
                <div key={u.id} className="mobile-data-card" style={{ opacity: u.active ? 1 : 0.65 }}>
                  <div className="mobile-data-card-header">
                    <div>
                      <div className="mobile-data-card-title">{u.name}</div>
                      <div className="mobile-data-card-sub font-mono">@{u.username}</div>
                    </div>
                    {u.active ? (
                      <span className="badge badge-COMPLETED">Aktif</span>
                    ) : (
                      <span className="badge badge-REJECTED">Nonaktif</span>
                    )}
                  </div>

                  <div className="mobile-data-card-grid">
                    <div className="mobile-data-card-field">
                      <span className="mobile-data-card-label">Role Akses</span>
                      <span className="mobile-data-card-val">
                        <span className={`user-role-badge role-${u.role}`} style={{ display: 'inline-block' }}>
                          {u.role}
                        </span>
                      </span>
                    </div>
                    <div className="mobile-data-card-field">
                      <span className="mobile-data-card-label">Status Password</span>
                      <span className="mobile-data-card-val" style={{ fontSize: '0.775rem' }}>
                        {u.must_change_password ? '🔒 Wajib Ganti' : '✓ Aman'}
                      </span>
                    </div>
                    <div className="mobile-data-card-field" style={{ gridColumn: 'span 2' }}>
                      <span className="mobile-data-card-label">Email Terdaftar</span>
                      <span className="mobile-data-card-val font-mono" style={{ fontSize: '0.825rem' }}>
                        {u.email}
                      </span>
                    </div>
                  </div>

                  <div className="mobile-data-card-actions">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setSelectedUserForPassword(u);
                        setCustomPasswordInput('');
                        setCustomPasswordError('');
                      }}
                    >
                      <KeyRound size={14} />
                      <span>Set Password</span>
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleResetPassword(u.id)}
                    >
                      <span>Reset</span>
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ color: u.active ? '#ef4444' : '#10b981' }}
                      onClick={() => handleToggleActive(u.id)}
                    >
                      {u.active ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                      <span>{u.active ? 'Nonaktif' : 'Aktif'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal Buat Akun Baru */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">Buat Akun Pengguna Baru</div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowCreateModal(false)}>
                <X size={16} />
              </button>
            </div>

            {createdResult ? (
              <div className="modal-body" style={{ textAlign: 'center', padding: '32px' }}>
                <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Akun Berhasil Dibuat!</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '6px' }}>
                  Berikan username dan initial password ini kepada pengguna. Sistem akan memaksa penggantian password saat login pertama kali.
                </p>

                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '20px',
                    margin: '20px 0',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Username:</span>
                    <strong className="font-mono">{createdResult.username}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Initial Password:</span>
                    <strong className="font-mono" style={{ color: '#4f46e5', fontSize: '1.1rem' }}>
                      {createdResult.initialPassword}
                    </strong>
                  </div>
                </div>

                <button className="btn btn-primary" onClick={() => setShowCreateModal(false)}>
                  Selesai
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateUser}>
                <div className="modal-body">
                  {error && (
                    <div
                      style={{
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        color: '#b91c1c',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        marginBottom: '16px',
                      }}
                    >
                      {error}
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Nama Lengkap</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Contoh: Ibu Rina (SD Sukamaju)"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="form-group">
                      <label className="form-label">Username</label>
                      <input
                        type="text"
                        className="form-input font-mono"
                        placeholder="Contoh: cust_sukamaju"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-input"
                        placeholder="Contoh: rina@sekolah.sch.id"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Peran / Role</label>
                    <select
                      className="form-select"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="CUSTOMER">CUSTOMER (Pelanggan / Sekolah)</option>
                      <option value="OWNER">OWNER (Pemilik Konveksi)</option>
                      <option value="SUPER_ADMIN">SUPER_ADMIN (Akses Penuh)</option>
                    </select>
                  </div>

                  {role === 'CUSTOMER' && (
                    <div className="form-group">
                      <label className="form-label">Hubungkan ke Data Lembaga / Customer</label>
                      <select
                        className="form-select"
                        value={customerId}
                        onChange={(e) => setCustomerId(e.target.value)}
                        required
                      >
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.code}) - {c.pic}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                    Batal
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Menyimpan...' : 'Generate User & Initial Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: SET CUSTOM PASSWORD UNTUK USER/ADMIN */}
      {selectedUserForPassword && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={20} color="#4f46e5" />
                <div>
                  <div className="modal-title">Atur Password Baru</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Untuk: <strong>{selectedUserForPassword.name}</strong> (@{selectedUserForPassword.username})
                  </div>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedUserForPassword(null)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSetCustomPassword}>
              <div className="modal-body">
                {customPasswordError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px', borderRadius: '8px', fontSize: '0.825rem', marginBottom: '14px' }}>
                    {customPasswordError}
                  </div>
                )}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Password Baru (Min. 6 Karakter)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ketik password baru untuk akun ini"
                    value={customPasswordInput}
                    onChange={(e) => setCustomPasswordInput(e.target.value)}
                    required
                    autoFocus
                  />
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
                    Password akan langsung aktif dan pengguna dapat login dengan password ini.
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedUserForPassword(null)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={customPasswordLoading}>
                  {customPasswordLoading ? 'Menyimpan...' : 'Simpan Password Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
