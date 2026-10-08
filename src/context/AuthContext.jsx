import React, { createContext, useContext, useState, useEffect } from 'react';

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

  const login = async (username, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login gagal');
    }

    setUser(data.user);
    setCustomer(data.customer || null);
    setMustChangePassword(Boolean(data.must_change_password));
    return data;
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
