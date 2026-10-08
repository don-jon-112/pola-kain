import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, ensureDefaultAdminInFirestore } from '../services/firebase';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { verifyPassword, hashPassword, isHashed } from '../utils/crypto';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('konveksi_user');
      return saved && saved !== 'undefined' ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [customer, setCustomer] = useState(() => {
    try {
      const saved = localStorage.getItem('konveksi_customer');
      return saved && saved !== 'undefined' ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [mustChangePassword, setMustChangePassword] = useState(() => {
    try {
      return localStorage.getItem('konveksi_must_change_pw') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('konveksi_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('konveksi_user');
    }
  }, [user]);

  useEffect(() => {
    if (customer) {
      localStorage.setItem('konveksi_customer', JSON.stringify(customer));
    } else {
      localStorage.removeItem('konveksi_customer');
    }
  }, [customer]);

  useEffect(() => {
    localStorage.setItem('konveksi_must_change_pw', String(mustChangePassword));
  }, [mustChangePassword]);

  // When Firebase is configured, auto-seed default admin if Firestore is empty
  useEffect(() => {
    if (db) {
      ensureDefaultAdminInFirestore();
    }
  }, []);

  const login = async (username, password) => {
    const cleanUser = (username || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanUser || !cleanPass) {
      throw new Error('Username dan password wajib diisi');
    }

    // 1. Coba login lewat backend API Express terlebih dahulu
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUser, password: cleanPass }),
      });

      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (res.ok) {
        setUser(data.user);
        setCustomer(data.customer || null);
        setMustChangePassword(Boolean(data.must_change_password));
        return data;
      } else {
        if (res.status === 401) {
          throw new Error('Username atau password salah. Silakan periksa kembali.');
        }
        if (res.status === 403) {
          throw new Error(data.error || 'Akun Anda sedang dinonaktifkan oleh administrator');
        }
      }
    } catch (apiErr) {
      // Jika pesan adalah kesalahan kredensial atau akun dinonaktifkan, teruskan ke UI
      if (
        apiErr.message.includes('Username atau password salah') ||
        apiErr.message.includes('dinonaktifkan') ||
        apiErr.message.includes('wajib diisi')
      ) {
        throw apiErr;
      }
      console.warn('Backend server lokal tidak merespons, mencoba autentikasi langsung ke Firebase Firestore...');
    }

    // 2. Fallback autentikasi langsung ke Cloud Firestore (untuk deploy Vercel / Cloud)
    if (db) {
      try {
        await ensureDefaultAdminInFirestore();
        const usersRef = collection(db, 'users');

        // Cari berdasarkan username
        let q = query(usersRef, where('username', '==', cleanUser));
        let snap = await getDocs(q);

        // Jika tidak ketemu berdasarkan username, cari berdasarkan email
        if (snap.empty) {
          q = query(usersRef, where('email', '==', cleanUser));
          snap = await getDocs(q);
        }

        if (!snap.empty) {
          const userDoc = snap.docs[0].data();
          const isPasswordValid = await verifyPassword(cleanPass, userDoc.password);

          if (isPasswordValid) {
            if (userDoc.active === false) {
              throw new Error('Akun Anda sedang dinonaktifkan oleh administrator');
            }

            // Jika password di Firestore masih plain text, upgrade otomatis ke bcrypt hash
            if (!isHashed(userDoc.password)) {
              try {
                const hashed = await hashPassword(cleanPass);
                await updateDoc(doc(db, 'users', snap.docs[0].id), { password: hashed });
              } catch (upErr) {
                console.warn('Auto upgrade password hash in Firestore:', upErr);
              }
            }

            const { password: _, ...safeUser } = userDoc;
            setUser(safeUser);
            setCustomer(null);
            setMustChangePassword(Boolean(userDoc.must_change_password));
            return { user: safeUser };
          } else {
            throw new Error('Password salah. Silakan periksa kembali password Anda.');
          }
        }
      } catch (firestoreErr) {
        if (
          firestoreErr.message.includes('Password salah') ||
          firestoreErr.message.includes('dinonaktifkan')
        ) {
          throw firestoreErr;
        }
        if (firestoreErr.code === 'permission-denied') {
          throw new Error('Akses Firebase Firestore ditolak. Pastikan Firestore Security Rules sudah di-publish.');
        }
        console.error('Firestore auth error:', firestoreErr);
      }
    }

    throw new Error('Username atau password salah. Silakan periksa kembali.');
  };

  const logout = () => {
    setUser(null);
    setCustomer(null);
    setMustChangePassword(false);
    localStorage.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        customer,
        mustChangePassword,
        setMustChangePassword,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
