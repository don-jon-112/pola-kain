import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import MobileBottomNav from './components/MobileBottomNav';
import ReceiptModal from './components/ReceiptModal';
import OrderDetailModal from './components/OrderDetailModal';
import DeliveryInvoiceModal from './components/DeliveryInvoiceModal';

// Views
import LoginView from './views/LoginView';
import ChangePasswordView from './views/ChangePasswordView';
import DashboardView from './views/DashboardView';
import OrdersView from './views/OrdersView';
import CustomerOrderRequestView from './views/CustomerOrderRequestView';
import ProductsView from './views/ProductsView';
import InventoryView from './views/InventoryView';
import DeliveryView from './views/DeliveryView';
import FinanceView from './views/FinanceView';
import PayrollView from './views/PayrollView';
import UsersView from './views/UsersView';

function MainApp() {
  const { user, mustChangePassword } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeReceiptOrder, setActiveReceiptOrder] = useState(null);
  const [activeDetailOrder, setActiveDetailOrder] = useState(null);
  const [activeDeliveryInvoice, setActiveDeliveryInvoice] = useState(null);

  // If user is not logged in
  if (!user) {
    return <LoginView />;
  }

  // If mandatory change password on first login is detected (Section 4 of Master Plan)
  if (mustChangePassword) {
    return <ChangePasswordView />;
  }


  const handleStatusUpdate = async (orderId, newStatus, note) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          notes: note,
          updated_by_name: user.name,
        }),
      });

      if (res.ok) {
        // Refresh detail order
        const detailRes = await fetch(`/api/orders/${orderId}`);
        const updatedDetail = await detailRes.json();
        setActiveDetailOrder(updatedDetail);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openOrderDetail = async (order) => {
    try {
      const res = await fetch(`/api/orders/${order.id}`);
      const full = await res.json();
      setActiveDetailOrder(full);
    } catch (err) {
      setActiveDetailOrder(order);
    }
  };

  const openReceipt = async (order) => {
    try {
      const res = await fetch(`/api/orders/${order.id}`);
      const full = await res.json();
      setActiveReceiptOrder(full);
    } catch (err) {
      setActiveReceiptOrder(order);
    }
  };

  const openPartialShipmentFromOrder = (order) => {
    setActiveDetailOrder(null);
    setCurrentView('delivery');
  };

  return (
    <div className="app-layout">
      {/* Sidebar with Mobile Drawer support */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        mobileOpen={mobileNavOpen}
        setMobileOpen={setMobileNavOpen}
      />

      {/* Main Content Area */}
      <div className="main-wrapper">
        <Navbar
          currentView={currentView}
          onToggleMobileMenu={() => setMobileNavOpen((prev) => !prev)}
        />

        {currentView === 'dashboard' && (
          <DashboardView
            onNavigate={setCurrentView}
            onViewOrder={openOrderDetail}
            onViewReceipt={openReceipt}
          />
        )}

        {currentView === 'order-request' && (
          <CustomerOrderRequestView
            onOrderSubmitted={(newOrd) => {
              openReceipt(newOrd);
              setCurrentView('orders');
            }}
            onCancel={() => setCurrentView('orders')}
          />
        )}

        {currentView === 'orders' && (
          <OrdersView
            onNavigate={setCurrentView}
            onViewOrder={openOrderDetail}
            onViewReceipt={openReceipt}
            onViewDeliveryInvoice={(dlv) => setActiveDeliveryInvoice(dlv)}
          />
        )}

        {currentView === 'products' && <ProductsView />}

        {currentView === 'inventory' && <InventoryView />}

        {currentView === 'delivery' && (
          <DeliveryView
            onViewDeliveryInvoice={(dlv) => setActiveDeliveryInvoice(dlv)}
          />
        )}

        {currentView === 'finance' && <FinanceView />}

        {currentView === 'payroll' && <PayrollView />}

        {currentView === 'users' && <UsersView />}

        {/* Mobile Bottom Navigation Bar (Fixed for Thumb Reach) */}
        <MobileBottomNav
          currentView={currentView}
          setCurrentView={setCurrentView}
          onOpenMobileMenu={() => setMobileNavOpen(true)}
        />
      </div>

      {/* Order Detail Modal */}
      {activeDetailOrder && (
        <OrderDetailModal
          order={activeDetailOrder}
          onClose={() => setActiveDetailOrder(null)}
          onStatusUpdate={handleStatusUpdate}
          onViewReceipt={(ord) => {
            setActiveReceiptOrder(ord);
          }}
          onOpenPartialShipment={openPartialShipmentFromOrder}
          onViewDeliveryInvoice={(dlv) => {
            setActiveDeliveryInvoice(dlv);
          }}
        />
      )}

      {/* Bukti Pemesanan Modal (Original PO Receipt) */}
      {activeReceiptOrder && (
        <ReceiptModal
          order={activeReceiptOrder}
          onClose={() => setActiveReceiptOrder(null)}
        />
      )}

      {/* Faktur Pengiriman & Surat Jalan Modal (Delivery Invoice per Shipment Batch) */}
      {activeDeliveryInvoice && (
        <DeliveryInvoiceModal
          delivery={activeDeliveryInvoice}
          onClose={() => setActiveDeliveryInvoice(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
