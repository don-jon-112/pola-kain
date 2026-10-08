import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Boxes,
  Truck,
  DollarSign,
  Users,
  UserCheck,
  LogOut,
  Scissors,
  PlusCircle,
  X,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ChangePasswordView from '../views/ChangePasswordView';
import { APP_VERSION } from '../config/version';

export default function Sidebar({ currentView, setCurrentView, mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  if (!user) return null;

  const role = user.role;

  const handleNavClick = (view) => {
    setCurrentView(view);
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  };

  return (
    <>
      {/* Backdrop overlay for mobile screen */}
      <div
        className={`sidebar-overlay ${mobileOpen ? 'mobile-open' : ''}`}
        onClick={() => setMobileOpen && setMobileOpen(false)}
      />

      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="brand-badge">
            <div className="brand-icon">
              <Scissors size={20} strokeWidth={2.5} />
            </div>
            <div>
              <div className="brand-name">POLAKAIN</div>
              <div className="brand-sub">Garment Management</div>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            className="sidebar-close-btn"
            onClick={() => setMobileOpen && setMobileOpen(false)}
            title="Tutup Menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav List */}
        <div className="sidebar-nav">
          {/* COMMON: Dashboard */}
          <button
            className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavClick('dashboard')}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>

          {/* CUSTOMER SPECIFIC */}
          {role === 'CUSTOMER' && (
            <>
              <div className="nav-section-title">Pemesanan</div>
              <button
                className={`nav-item ${currentView === 'order-request' ? 'active' : ''}`}
                onClick={() => handleNavClick('order-request')}
              >
                <PlusCircle size={18} />
                <span>Buat Pesanan Baru</span>
              </button>
              <button
                className={`nav-item ${currentView === 'orders' ? 'active' : ''}`}
                onClick={() => handleNavClick('orders')}
              >
                <ShoppingBag size={18} />
                <span>Pesanan Saya</span>
              </button>
            </>
          )}

          {/* OWNER & SUPER ADMIN */}
          {(role === 'OWNER' || role === 'SUPER_ADMIN') && (
            <>
              <div className="nav-section-title">Operasional</div>
              <button
                className={`nav-item ${currentView === 'orders' ? 'active' : ''}`}
                onClick={() => handleNavClick('orders')}
              >
                <ShoppingBag size={18} />
                <span>Kelola Pesanan</span>
              </button>
              <button
                className={`nav-item ${currentView === 'products' ? 'active' : ''}`}
                onClick={() => handleNavClick('products')}
              >
                <Package size={18} />
                <span>Master Produk & Size</span>
              </button>
              <button
                className={`nav-item ${currentView === 'inventory' ? 'active' : ''}`}
                onClick={() => handleNavClick('inventory')}
              >
                <Boxes size={18} />
                <span>Stok & Bahan Baku</span>
              </button>
              <button
                className={`nav-item ${currentView === 'delivery' ? 'active' : ''}`}
                onClick={() => handleNavClick('delivery')}
              >
                <Truck size={18} />
                <span>Pengiriman (Delivery)</span>
              </button>

              <div className="nav-section-title">Finansial & SDM</div>
              <button
                className={`nav-item ${currentView === 'finance' ? 'active' : ''}`}
                onClick={() => handleNavClick('finance')}
              >
                <DollarSign size={18} />
                <span>Keuangan & Laba</span>
              </button>
              <button
                className={`nav-item ${currentView === 'payroll' ? 'active' : ''}`}
                onClick={() => handleNavClick('payroll')}
              >
                <Users size={18} />
                <span>Pegawai & Gaji (Payroll)</span>
              </button>
            </>
          )}

          {/* SUPER ADMIN SPECIFIC */}
          {(role === 'SUPER_ADMIN' || role === 'OWNER') && (
            <>
              <div className="nav-section-title">Manajemen Akun</div>
              <button
                className={`nav-item ${currentView === 'users' ? 'active' : ''}`}
                onClick={() => handleNavClick('users')}
              >
                <UserCheck size={18} />
                <span>Kelola Pengguna</span>
              </button>
            </>
          )}
        </div>

        {/* Footer Profile */}
        <div className="sidebar-footer">
          <div className="user-profile-widget">
            <div className="user-info-text">
              <div className="user-name-label" title={user.name}>
                {user.name}
              </div>
              <span className={`user-role-badge role-${role}`}>
                {role === 'SUPER_ADMIN' ? 'Super Admin' : role === 'OWNER' ? 'Owner Konveksi' : 'Customer'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="btn-icon"
                style={{ color: '#64748b', background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px' }}
                title="Ubah Password Akun Saya"
              >
                <KeyRound size={17} />
              </button>
              <button
                onClick={() => {
                  if (setMobileOpen) setMobileOpen(false);
                  logout();
                }}
                className="btn-icon"
                style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px' }}
                title="Keluar / Logout"
              >
                <LogOut size={17} />
              </button>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '0.7rem', color: '#94a3b8' }}>
            PolaKain v{APP_VERSION}
          </div>
        </div>
      </aside>

      {/* Voluntary Change Password Modal */}
      {showPasswordModal && (
        <ChangePasswordView onClose={() => setShowPasswordModal(false)} />
      )}
    </>
  );
}
