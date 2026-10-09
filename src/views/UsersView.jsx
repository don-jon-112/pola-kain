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
  Eye,
  EyeOff,
  Building2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { doc, updateDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { hashPassword } from '../utils/crypto';

const safeParseJson = (text, fallback = null) => {
  if (!text || typeof text !== 'string') return fallback;
  try {
    const trimmed = text.trim();
    if (!trimmed) return fallback;
    return JSON.parse(trimmed);
  } catch {
    return fallback;
  }
};

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
  const [isAddingNewCustomer, setIsAddingNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPic, setNewCustomerPic] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Custom password states
  const [selectedUserForPassword, setSelectedUserForPassword] = useState(null);
  const [customPasswordInput, setCustomPasswordInput] = useState('');
  const [showCustomPassword, setShowCustomPassword] = useState(true);
  const [customPasswordLoading, setCustomPasswordLoading] = useState(false);
  const [customPasswordError, setCustomPasswordError] = useState('');

  // Ganti Lembaga Customer states (Khusus SUPER_ADMIN)
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const [selectedUserForCustomer, setSelectedUserForCustomer] = useState(null);
  const [targetCustomerId, setTargetCustomerId] = useState('');
  const [isNewCustomerInModal, setIsNewCustomerInModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPic, setNewCustPic] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [changeCustomerLoading, setChangeCustomerLoading] = useState(false);
  const [changeCustomerError, setChangeCustomerError] = useState('');

  const getCustomerInfo = (cid) => {
    if (!cid) return null;
    return customers.find((c) => c.id === cid);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      let uList = [];
      let cList = [];

      // 1. Ambil dari Firestore terlebih dahulu jika Firebase aktif
      if (db) {
        try {
          const snap = await getDocs(collection(db, 'users'));
          if (!snap.empty) {
            uList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          }
        } catch (fErr) {
          console.warn('Firestore fetch users:', fErr.message);
        }

        try {
          const cSnap = await getDocs(collection(db, 'customers'));
          // Ambil apa adanya dari Firestore. Jika user telah menghapus customer, data tetap kosong dan TIDAK di-generate ulang
          cList = cSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        } catch (cErr) {
          console.warn('Firestore fetch customers:', cErr.message);
        }
      }

      // 2. Ambil dari backend lokal HANYA jika Firestore tidak digunakan
      if (!db) {
        try {
          const uRes = await fetch('/api/users');
          const text = await uRes.text();
          const data = safeParseJson(text, null);
          if (Array.isArray(data)) {
            uList = data;
          }
        } catch (apiErr) {
          // Backend offline
        }

        try {
          const cRes = await fetch('/api/customers');
          const text = await cRes.text();
          const data = safeParseJson(text, []);
          if (Array.isArray(data)) {
            cList = data;
          }
        } catch (cErr) {
          // silent
        }
      }

      setUsers(uList);
      setCustomers(cList);
      if (cList.length > 0) {
        setCustomerId((prev) => (prev && prev !== '__NEW__' ? prev : cList[0].id));
      } else {
        setCustomerId('__NEW__');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreateModal = () => {
    setUsername('');
    setEmail('');
    setName('');
    setRole('CUSTOMER');
    const hasCustomers = customers.length > 0;
    setIsAddingNewCustomer(!hasCustomers);
    setCustomerId(hasCustomers ? customers[0].id : '__NEW__');
    setNewCustomerName('');
    setNewCustomerPic('');
    setNewCustomerPhone('');
    setError('');
    setCreatedResult(null);
    setShowCreateModal(true);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const cleanUsername = username.trim().toLowerCase();
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = name.trim();

      if (!cleanUsername || !cleanEmail || !cleanName) {
        throw new Error('Semua data pengguna wajib diisi');
      }

      // Validasi duplikat langsung di client jika sudah ada di state
      const existingUser = users.find(
        (u) =>
          u.username?.toLowerCase() === cleanUsername ||
          u.email?.toLowerCase() === cleanEmail
      );
      if (existingUser) {
        throw new Error(
          existingUser.username?.toLowerCase() === cleanUsername
            ? `Username "${cleanUsername}" sudah terdaftar. Silakan gunakan username lain.`
            : `Email "${cleanEmail}" sudah terdaftar. Silakan gunakan email lain.`
        );
      }

      let assignedCustomerId = null;
      if (role === 'CUSTOMER') {
        const needNewCustomer = customers.length === 0 || isAddingNewCustomer || customerId === '__NEW__';
        if (needNewCustomer) {
          const cleanCustName = newCustomerName.trim();
          if (!cleanCustName) {
            throw new Error('Nama Lembaga / Sekolah baru wajib diisi untuk akun Pelanggan');
          }
          const newCustId = 'cust_' + Date.now();
          const newCustCode = 'CST-' + Math.floor(100 + Math.random() * 900);
          const newCustObj = {
            id: newCustId,
            code: newCustCode,
            name: cleanCustName,
            pic: newCustomerPic.trim() || cleanName,
            phone: newCustomerPhone.trim() || '',
            email: cleanEmail,
            created_at: new Date().toISOString(),
          };

          // Simpan ke Firestore
          if (db) {
            try {
              await setDoc(doc(db, 'customers', newCustId), newCustObj);
            } catch (fErr) {
              console.warn('Firestore create customer error:', fErr);
            }
          }

          // Sinkronkan ke API backend jika online
          try {
            await fetch('/api/customers', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newCustObj),
            });
          } catch (cErr) {
            // offline
          }

          setCustomers((prev) => [...prev, newCustObj]);
          assignedCustomerId = newCustId;
        } else {
          if (!customerId) {
            throw new Error('Silakan pilih data Lembaga / Customer yang akan dihubungkan');
          }
          assignedCustomerId = customerId;
        }
      }

      // Generate initial password & unique ID
      const initialPassword = 'User' + Math.floor(1000 + Math.random() * 9000);
      const hashedPassword = await hashPassword(initialPassword);
      const newUserId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

      const newUserPayload = {
        id: newUserId,
        username: cleanUsername,
        email: cleanEmail,
        name: cleanName,
        password: hashedPassword,
        role,
        customer_id: assignedCustomerId,
        must_change_password: true,
        active: true,
        created_at: new Date().toISOString(),
      };

      // 1. Simpan langsung ke Firebase Firestore jika terhubung (password terenkripsi)
      if (db) {
        try {
          await setDoc(doc(db, 'users', newUserId), newUserPayload);
        } catch (fErr) {
          console.error('Firestore create user error:', fErr);
          if (fErr.code === 'permission-denied') {
            throw new Error('Akses Firebase Firestore ditolak. Pastikan Firestore Rules sudah di-publish.');
          }
        }
      }

      // 2. Sinkronkan ke API backend lokal jika tersedia
      try {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: newUserId,
            username: cleanUsername,
            email: cleanEmail,
            name: cleanName,
            role,
            initialPassword,
            customer_id: assignedCustomerId,
          }),
        });
        const text = await res.text();
        const apiData = safeParseJson(text, {});
        if (!res.ok && apiData?.error) {
          throw new Error(apiData.error);
        }
      } catch (apiErr) {
        if (
          apiErr.message.includes('sudah terdaftar') ||
          apiErr.message.includes('wajib diisi')
        ) {
          throw apiErr;
        }
        console.warn('API backend /api/users offline, data tersimpan di Cloud Firestore.');
      }

      setCreatedResult({
        username: cleanUsername,
        initialPassword,
      });

      setUsername('');
      setEmail('');
      setName('');
      setIsAddingNewCustomer(false);
      setNewCustomerName('');
      setNewCustomerPic('');
      setNewCustomerPhone('');
      fetchData();
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('JSON') || msg.includes('unexpected end of data')) {
        setError('Gagal memproses data dari server. Silakan coba lagi.');
      } else {
        setError(msg || 'Terjadi kesalahan sistem saat membuat akun');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (userId) => {
    if (!window.confirm('Reset password untuk akun ini? User akan diwajibkan ganti password saat login berikutnya.')) return;
    try {
      const tempPassword = 'Reset' + Math.floor(1000 + Math.random() * 9000);
      const hashedTempPassword = await hashPassword(tempPassword);

      // 1. Update ke Firestore jika terhubung
      if (db) {
        try {
          await updateDoc(doc(db, 'users', userId), {
            password: hashedTempPassword,
            must_change_password: true,
            updated_at: new Date().toISOString(),
          });
        } catch (fErr) {
          console.warn('Firestore reset password error:', fErr);
        }
      }

      // 2. Kirim ke backend jika online
      try {
        await fetch(`/api/users/${userId}/reset-password`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tempPassword }),
        });
      } catch (apiErr) {
        console.warn('API reset-password offline');
      }

      alert(`Password berhasil di-reset!\nPassword baru sementara: ${tempPassword}`);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Gagal me-reset password: ' + err.message);
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
      try {
        await fetch(`/api/users/${selectedUserForPassword.id}/set-password`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newPassword: customPasswordInput }),
        });
      } catch (apiErr) {
        console.warn('API backend set-password offline, syncing directly to Firestore...');
      }

      if (db && selectedUserForPassword?.id) {
        try {
          const hashedCustomPassword = await hashPassword(customPasswordInput);
          const userDocRef = doc(db, 'users', selectedUserForPassword.id);
          await updateDoc(userDocRef, {
            password: hashedCustomPassword,
            must_change_password: false,
            updated_at: new Date().toISOString(),
          });
        } catch (fErr) {
          console.warn('Firestore user update:', fErr.message);
        }
      }

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

  const handleToggleActive = async (userId, currentActive) => {
    try {
      const newActive = !currentActive;

      if (db) {
        try {
          await updateDoc(doc(db, 'users', userId), {
            active: newActive,
            updated_at: new Date().toISOString(),
          });
        } catch (fErr) {
          console.warn('Firestore toggle active error:', fErr);
        }
      }

      try {
        await fetch(`/api/users/${userId}/toggle-active`, { method: 'PUT' });
      } catch (apiErr) {
        console.warn('API toggle active offline');
      }

      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const openChangeCustomerModal = (targetUser) => {
    if (!isSuperAdmin) {
      alert('Hanya Super Admin yang berhak mengubah data lembaga pengguna.');
      return;
    }
    setSelectedUserForCustomer(targetUser);
    setTargetCustomerId(targetUser.customer_id || (customers.length > 0 ? customers[0].id : '__NEW__'));
    setIsNewCustomerInModal(customers.length === 0);
    setNewCustName('');
    setNewCustPic('');
    setNewCustPhone('');
    setChangeCustomerError('');
  };

  const handleSaveCustomerChange = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      setChangeCustomerError('Hanya Super Admin yang berhak mengubah data lembaga');
      return;
    }
    if (!selectedUserForCustomer) return;

    try {
      setChangeCustomerLoading(true);
      setChangeCustomerError('');

      let finalCustomerId = targetCustomerId;

      // Jika mendaftarkan lembaga baru di dalam modal
      if (customers.length === 0 || isNewCustomerInModal || targetCustomerId === '__NEW__') {
        const cleanName = newCustName.trim();
        if (!cleanName) {
          throw new Error('Nama Lembaga / Sekolah baru wajib diisi');
        }

        const newId = 'cust_' + Date.now();
        const newCode = 'CST-' + Math.floor(100 + Math.random() * 900);
        const newObj = {
          id: newId,
          code: newCode,
          name: cleanName,
          pic: newCustPic.trim() || selectedUserForCustomer.name,
          phone: newCustPhone.trim() || '',
          email: selectedUserForCustomer.email || '',
          created_at: new Date().toISOString(),
        };

        if (db) {
          try {
            await setDoc(doc(db, 'customers', newId), newObj);
          } catch (fErr) {
            console.warn('Firestore create customer:', fErr);
          }
        }

        try {
          await fetch('/api/customers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newObj),
          });
        } catch (apiErr) {
          // offline
        }

        setCustomers((prev) => [...prev, newObj]);
        finalCustomerId = newId;
      }

      if (!finalCustomerId) {
        throw new Error('Silakan pilih lembaga yang ingin dihubungkan');
      }

      // 1. Update ke Firestore
      if (db) {
        try {
          await updateDoc(doc(db, 'users', selectedUserForCustomer.id), {
            customer_id: finalCustomerId,
            updated_at: new Date().toISOString(),
          });
        } catch (fErr) {
          console.warn('Firestore update user customer:', fErr);
          if (fErr.code === 'permission-denied') {
            throw new Error('Akses Firebase ditolak. Pastikan izin Firestore memadai.');
          }
        }
      }

      // 2. Update ke Backend Express jika online
      try {
        await fetch(`/api/users/${selectedUserForCustomer.id}/customer`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customer_id: finalCustomerId }),
        });
      } catch (apiErr) {
        // offline
      }

      // 3. Update state lokal seketika
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUserForCustomer.id ? { ...u, customer_id: finalCustomerId } : u
        )
      );

      setSelectedUserForCustomer(null);
    } catch (err) {
      setChangeCustomerError(err.message || 'Gagal mengubah lembaga pengguna');
    } finally {
      setChangeCustomerLoading(false);
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

          <button className="btn btn-primary btn-sm" onClick={handleOpenCreateModal}>
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
                          {u.role === 'CUSTOMER' && (
                            <div style={{ marginTop: '6px' }}>
                              {getCustomerInfo(u.customer_id) ? (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    background: '#eff6ff',
                                    color: '#1d4ed8',
                                    fontSize: '0.75rem',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    fontWeight: 600,
                                    border: '1px solid #bfdbfe',
                                  }}
                                  title={`ID Lembaga: ${u.customer_id}`}
                                >
                                  🏫 {getCustomerInfo(u.customer_id).name}
                                </span>
                              ) : (
                                <span
                                  style={{
                                    display: 'inline-block',
                                    fontSize: '0.725rem',
                                    color: '#dc2626',
                                    background: '#fef2f2',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    border: '1px solid #fecaca',
                                    fontStyle: 'italic',
                                  }}
                                >
                                  ⚠️ Belum Terhubung
                                </span>
                              )}
                            </div>
                          )}
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
                          <div style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                            {isSuperAdmin && u.role === 'CUSTOMER' && (
                              <button
                                className="btn btn-secondary btn-sm"
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '4px 8px',
                                  color: '#4f46e5',
                                  borderColor: '#c7d2fe',
                                  background: '#eef2ff',
                                }}
                                title="Ganti Lembaga / Sekolah untuk Customer ini"
                                onClick={() => openChangeCustomerModal(u)}
                              >
                                <Building2 size={13} />
                                <span>Ganti Lembaga</span>
                              </button>
                            )}
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
                              onClick={() => handleToggleActive(u.id, u.active)}
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
                    {u.role === 'CUSTOMER' && (
                      <div className="mobile-data-card-field" style={{ gridColumn: 'span 2' }}>
                        <span className="mobile-data-card-label">Lembaga Terhubung</span>
                        <span className="mobile-data-card-val" style={{ fontSize: '0.825rem' }}>
                          {getCustomerInfo(u.customer_id) ? (
                            <span style={{ fontWeight: 700, color: '#1d4ed8' }}>
                              🏫 {getCustomerInfo(u.customer_id).name} ({getCustomerInfo(u.customer_id).code || getCustomerInfo(u.customer_id).id})
                            </span>
                          ) : (
                            <span style={{ color: '#ef4444', fontStyle: 'italic' }}>
                              ⚠️ Belum Terhubung Lembaga
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    <div className="mobile-data-card-field" style={{ gridColumn: 'span 2' }}>
                      <span className="mobile-data-card-label">Email Terdaftar</span>
                      <span className="mobile-data-card-val font-mono" style={{ fontSize: '0.825rem' }}>
                        {u.email}
                      </span>
                    </div>
                  </div>

                  <div className="mobile-data-card-actions">
                    {isSuperAdmin && u.role === 'CUSTOMER' && (
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#4f46e5', borderColor: '#c7d2fe', background: '#eef2ff' }}
                        onClick={() => openChangeCustomerModal(u)}
                      >
                        <Building2 size={14} />
                        <span>Ganti Lembaga</span>
                      </button>
                    )}
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
                      onClick={() => handleToggleActive(u.id, u.active)}
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
                    <div
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '14px',
                        marginBottom: '16px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '8px',
                          gap: '8px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <label className="form-label" style={{ marginBottom: 0, fontWeight: 700 }}>
                          Hubungkan ke Data Lembaga / Customer
                        </label>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem', padding: '3px 8px', height: 'auto' }}
                          onClick={() => {
                            const nextState = !isAddingNewCustomer;
                            setIsAddingNewCustomer(nextState);
                            if (nextState) {
                              setCustomerId('__NEW__');
                            } else if (customers.length > 0) {
                              setCustomerId(customers[0].id);
                            }
                          }}
                        >
                          {isAddingNewCustomer ? '← Pilih dari Daftar Lembaga' : '+ Daftarkan Lembaga Baru'}
                        </button>
                      </div>

                      {customers.length > 0 && !isAddingNewCustomer ? (
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <select
                            className="form-select"
                            value={customerId}
                            onChange={(e) => {
                              if (e.target.value === '__NEW__') {
                                setIsAddingNewCustomer(true);
                                setCustomerId('__NEW__');
                              } else {
                                setCustomerId(e.target.value);
                              }
                            }}
                            required={role === 'CUSTOMER' && !isAddingNewCustomer}
                          >
                            <option value="">-- Pilih Lembaga / Customer --</option>
                            {customers.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name} ({c.code || c.id}) {c.pic ? `- PIC: ${c.pic}` : ''}
                              </option>
                            ))}
                            <option value="__NEW__">+ Daftarkan Lembaga / Sekolah Baru...</option>
                          </select>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                            Hubungkan akun ini ke profil lembaga sekolah/instansi mitra agar pesanan & faktur tersinkronisasi.
                          </span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {customers.length === 0 && (
                            <div style={{ fontSize: '0.8rem', color: '#475569', background: '#f1f5f9', padding: '8px 12px', borderRadius: '6px' }}>
                              Belum ada data lembaga terdaftar. Masukkan nama sekolah / instansi di bawah untuk mendaftarkan lembaga baru:
                            </div>
                          )}
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                              Nama Lembaga / Sekolah Baru <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Contoh: SMA Negeri 1 Bintang"
                              value={newCustomerName}
                              onChange={(e) => setNewCustomerName(e.target.value)}
                              required={role === 'CUSTOMER'}
                            />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label" style={{ fontSize: '0.8rem' }}>
                                PIC / Nama Kontak
                              </label>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Contoh: Ibu Rina (Kesiswaan)"
                                value={newCustomerPic}
                                onChange={(e) => setNewCustomerPic(e.target.value)}
                              />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label" style={{ fontSize: '0.8rem' }}>
                                No. Telepon / WhatsApp
                              </label>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Contoh: 08123456789"
                                value={newCustomerPhone}
                                onChange={(e) => setNewCustomerPhone(e.target.value)}
                              />
                            </div>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: '#4f46e5' }}>
                            ✓ Data lembaga baru akan otomatis dibuat di sistem dan langsung dihubungkan ke akun ini.
                          </span>
                        </div>
                      )}
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
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showCustomPassword ? 'text' : 'password'}
                      className="form-input"
                      style={{ paddingRight: '40px' }}
                      placeholder="Ketik password baru untuk akun ini"
                      value={customPasswordInput}
                      onChange={(e) => setCustomPasswordInput(e.target.value)}
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowCustomPassword(!showCustomPassword)}
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
                      title={showCustomPassword ? 'Sembunyikan password' : 'Lihat password'}
                    >
                      {showCustomPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
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

      {/* MODAL: GANTI LEMBAGA UNTUK CUSTOMER (KHUSUS SUPER ADMIN) */}
      {selectedUserForCustomer && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    background: '#e0e7ff',
                    color: '#4338ca',
                    padding: '8px',
                    borderRadius: '8px',
                    display: 'flex',
                  }}
                >
                  <Building2 size={20} />
                </div>
                <div>
                  <div className="modal-title">Ganti Lembaga / Customer</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Khusus Super Admin • Pengguna: <strong>{selectedUserForCustomer.name}</strong> (@{selectedUserForCustomer.username})
                  </div>
                </div>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedUserForCustomer(null)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveCustomerChange}>
              <div className="modal-body">
                {changeCustomerError && (
                  <div
                    style={{
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#b91c1c',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '0.825rem',
                      marginBottom: '14px',
                    }}
                  >
                    {changeCustomerError}
                  </div>
                )}

                {/* Lembaga Saat Ini */}
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    marginBottom: '16px',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                    Lembaga Saat Ini Terhubung:
                  </span>
                  {getCustomerInfo(selectedUserForCustomer.customer_id) ? (
                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>
                      🏫 {getCustomerInfo(selectedUserForCustomer.customer_id).name}{' '}
                      <span className="font-mono" style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
                        ({getCustomerInfo(selectedUserForCustomer.customer_id).code || getCustomerInfo(selectedUserForCustomer.customer_id).id})
                      </span>
                    </div>
                  ) : (
                    <div style={{ color: '#ef4444', fontStyle: 'italic', fontSize: '0.875rem' }}>
                      ⚠️ Belum terhubung ke data lembaga manapun
                    </div>
                  )}
                </div>

                {/* Pilihan Lembaga Baru */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px',
                    }}
                  >
                    <label className="form-label" style={{ marginBottom: 0, fontWeight: 700 }}>
                      Pilih Lembaga Baru
                    </label>
                    {customers.length > 0 && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '2px 8px', height: 'auto' }}
                        onClick={() => {
                          const next = !isNewCustomerInModal;
                          setIsNewCustomerInModal(next);
                          if (next) setTargetCustomerId('__NEW__');
                          else setTargetCustomerId(customers[0]?.id || '');
                        }}
                      >
                        {isNewCustomerInModal ? '← Pilih yang Terdaftar' : '+ Lembaga Baru'}
                      </button>
                    )}
                  </div>

                  {customers.length > 0 && !isNewCustomerInModal ? (
                    <div>
                      <select
                        className="form-select"
                        value={targetCustomerId}
                        onChange={(e) => {
                          if (e.target.value === '__NEW__') {
                            setIsNewCustomerInModal(true);
                            setTargetCustomerId('__NEW__');
                          } else {
                            setTargetCustomerId(e.target.value);
                          }
                        }}
                        required
                      >
                        <option value="">-- Pilih Lembaga Tujuan --</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.code || c.id}) {c.pic ? `- PIC: ${c.pic}` : ''}
                          </option>
                        ))}
                        <option value="__NEW__">+ Daftarkan Lembaga / Sekolah Baru...</option>
                      </select>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                        Pesanan dan faktur akun ini akan dialihkan ke lembaga yang dipilih.
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {customers.length === 0 && (
                        <div style={{ fontSize: '0.8rem', color: '#475569', background: '#f1f5f9', padding: '8px 12px', borderRadius: '6px' }}>
                          Belum ada data lembaga terdaftar. Masukkan nama sekolah / instansi di bawah untuk mendaftarkan lembaga baru:
                        </div>
                      )}
                      <div>
                        <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                          Nama Lembaga / Sekolah Baru <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Contoh: SMA Negeri 1 Bintang"
                          value={newCustName}
                          onChange={(e) => setNewCustName(e.target.value)}
                          required
                          autoFocus
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>
                            PIC / Kontak
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Contoh: Pak Wahyu"
                            value={newCustPic}
                            onChange={(e) => setNewCustPic(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>
                            No. Telepon / WA
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Contoh: 0812345678"
                            value={newCustPhone}
                            onChange={(e) => setNewCustPhone(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedUserForCustomer(null)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={changeCustomerLoading}
                >
                  {changeCustomerLoading ? 'Menyimpan...' : 'Simpan Perubahan Lembaga'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
