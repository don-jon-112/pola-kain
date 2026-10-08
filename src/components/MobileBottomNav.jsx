import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  PlusCircle,
  Package,
  Boxes,
  Menu,
  DollarSign,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function MobileBottomNav({ currentView, setCurrentView, onOpenMobileMenu }) {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  if (role === 'CUSTOMER') {
    return (
      <nav className="mobile-bottom-nav">
        <button
          className={`bottom-nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => setCurrentView('dashboard')}
        >
          <LayoutDashboard size={20} />
          <span className="bottom-nav-label">Beranda</span>
        </button>

        <button
          className={`bottom-nav-item ${currentView === 'order-request' ? 'active' : ''}`}
          onClick={() => setCurrentView('order-request')}
        >
          <PlusCircle size={20} />
          <span className="bottom-nav-label">Buat Order</span>
        </button>

        <button
          className={`bottom-nav-item ${currentView === 'orders' ? 'active' : ''}`}
          onClick={() => setCurrentView('orders')}
        >
          <ShoppingBag size={20} />
          <span className="bottom-nav-label">Pesanan</span>
        </button>

        <button className="bottom-nav-item" onClick={onOpenMobileMenu}>
          <Menu size={20} />
          <span className="bottom-nav-label">Lainnya</span>
        </button>
      </nav>
    );
  }

  // Owner & Super Admin bottom nav
  return (
    <nav className="mobile-bottom-nav">
      <button
        className={`bottom-nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
        onClick={() => setCurrentView('dashboard')}
      >
        <LayoutDashboard size={20} />
        <span className="bottom-nav-label">Dashboard</span>
      </button>

      <button
        className={`bottom-nav-item ${currentView === 'orders' ? 'active' : ''}`}
        onClick={() => setCurrentView('orders')}
      >
        <ShoppingBag size={20} />
        <span className="bottom-nav-label">Pesanan</span>
      </button>

      <button
        className={`bottom-nav-item ${currentView === 'products' ? 'active' : ''}`}
        onClick={() => setCurrentView('products')}
      >
        <Package size={20} />
        <span className="bottom-nav-label">Produk</span>
      </button>

      <button
        className={`bottom-nav-item ${currentView === 'inventory' ? 'active' : ''}`}
        onClick={() => setCurrentView('inventory')}
      >
        <Boxes size={20} />
        <span className="bottom-nav-label">Stok</span>
      </button>

      <button className="bottom-nav-item" onClick={onOpenMobileMenu}>
        <Menu size={20} />
        <span className="bottom-nav-label">Menu</span>
      </button>
    </nav>
  );
}
