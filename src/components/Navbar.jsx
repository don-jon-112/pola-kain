import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Menu, User, ShieldCheck } from 'lucide-react';

export default function Navbar({ currentView, onToggleMobileMenu }) {
  const { user } = useAuth();

  const getTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return { title: 'Dashboard', desc: 'Ringkasan operasional dan analitik bisnis' };
      case 'order-request':
        return { title: 'Buat Pesanan', desc: 'Formulir order seragam baru' };
      case 'orders':
        return { title: 'Kelola Pesanan', desc: 'Pantau status dan riwayat order' };
      case 'products':
        return { title: 'Master Produk', desc: 'Katalog seragam, variasi size, dan harga' };
      case 'inventory':
        return { title: 'Inventori & Stok', desc: 'Stok kain, aksesoris, dan mutasi barang' };
      case 'delivery':
        return { title: 'Pengiriman', desc: 'Pengantaran pesanan ke pemesan' };
      case 'finance':
        return { title: 'Keuangan & Laba', desc: 'Pendapatan, pengeluaran, dan profit' };
      case 'payroll':
        return { title: 'Pegawai & Gaji', desc: 'Kelola pekerja workshop dan slip gaji' };
      case 'users':
        return { title: 'Manajemen Akun', desc: 'Kelola user dan hak akses' };
      default:
        return { title: 'PolaKain', desc: 'Sistem operasional terpadu' };
    }
  };

  const info = getTitle();

  const formatRole = (role) => {
    if (role === 'SUPER_ADMIN') return 'Super Admin';
    if (role === 'OWNER') return 'Owner Konveksi';
    return 'Customer';
  };

  return (
    <header className="top-navbar">
      <div className="navbar-left">
        {/* Hamburger button visible on mobile */}
        <button
          className="mobile-menu-toggle"
          onClick={onToggleMobileMenu}
          aria-label="Buka Menu"
        >
          <Menu size={20} />
        </button>

        <div className="page-title-group">
          <h1>{info.title}</h1>
          <p>{info.desc}</p>
        </div>
      </div>

      <div className="navbar-actions">
        {/* Clean Production User Status Pill */}
        {user && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#f8fafc',
              padding: '6px 12px',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              fontSize: '0.85rem',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
              }}
              title="Sistem Terhubung & Online"
            />
            <span style={{ fontWeight: 600, color: '#334155' }}>{user.name}</span>
            <span
              className="badge"
              style={{
                background: '#e0e7ff',
                color: '#4338ca',
                fontSize: '0.7rem',
                padding: '2px 8px',
              }}
            >
              {formatRole(user.role)}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
