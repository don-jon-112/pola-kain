import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, ensureDefaultAdminInFirestore } from '../services/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('konveksi_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [customer, setCustomer] = useState(() => {
    const saved = localStorage.getItem('konveksi_customer');
    return saved ? JSON.parse(saved) : null;
  });

  const [mustChangePassword, setMustChangePassword] = useState(() => {
    return localStorage.getItem('konveksi_must_change_pw') === 'true';
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

    // 1. Coba login lewat backend API Express terlebih dahulu
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUser, password: cleanPass }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setCustomer(data.customer || null);
        setMustChangePassword(Boolean(data.must_change_password));
        return data;
      } else {
        const data = await res.json();
        // Jika server menolak dengan pesan kredensial salah, teruskan pesan
        if (res.status === 401 || res.status === 403) {
          throw new Error(data.error || 'Username atau password salah');
        }
      }
    } catch (apiErr) {
      // Jika error 401/403 dari server lokal, lemparkan
      if (apiErr.message === 'Username atau password salah' || apiErr.message.includes('dinonaktifkan')) {
        throw apiErr;
      }
      console.warn('Backend server tidak dapat dijangkau, mencoba autentikasi langsung ke Firebase Firestore...');
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
          if (userDoc.password === cleanPass) {
            if (!userDoc.active) {
              throw new Error('Akun Anda sedang dinonaktifkan oleh administrator');
            }

            const { password: _, ...safeUser } = userDoc;
            setUser(safeUser);
            setCustomer(null);
            setMustChangePassword(Boolean(userDoc.must_change_password));
            return { user: safeUser };
          }
        }
      } catch (firestoreErr) {
        console.error('Firestore auth error:', firestoreErr);
        if (firestoreErr.message.includes('dinonaktifkan')) throw firestoreErr;
      }
    }

    throw new Error('Username atau password salah');
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
