import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Truck,
  PlusCircle,
  Package,
  Layers,
  ArrowRight,
  Eye,
  FileText,
  Scissors,
} from 'lucide-react';

export default function DashboardView({ onNavigate, onViewOrder, onViewReceipt }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const role = user?.role;

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, ordersRes, invRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch(role === 'CUSTOMER' ? `/api/orders?customer_id=${user.customer_id}` : '/api/orders'),
        fetch('/api/inventory'),
      ]);

      const [statsData, ordersData, invData] = await Promise.all([
        statsRes.json(),
        ordersRes.json(),
        invRes.json(),
      ]);

      setStats(statsData);
      setOrders(ordersData);
      setLowStockItems(invData.filter((it) => it.is_low_stock));
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [role, user]);

  // Aggregate active orders and WIP products for workshop owner
  const activeOrders = useMemo(() => {
    return orders.filter((o) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED');
  }, [orders]);

  const { totalActivePcs, totalShippedPcs, totalRemainingPcs, topProducts } = useMemo(() => {
    let ordered = 0;
    let shipped = 0;
    let remaining = 0;
    const prodMap = {};

    activeOrders.forEach((ord) => {
      (ord.items || []).forEach((it) => {
        const q = Number(it.quantity) || 0;
        const s = Number(it.shipped_quantity) || 0;
        const r = Number(it.remaining_quantity !== undefined ? it.remaining_quantity : q - s);
        ordered += q;
        shipped += s;
        remaining += r;

        const pKey = it.product_id || it.product_name;
        if (!prodMap[pKey]) {
          prodMap[pKey] = {
            product_name: it.product_name,
            category: it.category || 'Seragam',
            total_ordered: 0,
            total_shipped: 0,
            total_remaining: 0,
            orders_count: 0,
          };
        }
        prodMap[pKey].total_ordered += q;
        prodMap[pKey].total_shipped += s;
        prodMap[pKey].total_remaining += r;
        prodMap[pKey].orders_count += 1;
      });
    });

    const top = Object.values(prodMap)
      .sort((a, b) => b.total_remaining - a.total_remaining)
      .slice(0, 4);

    return {
      totalActivePcs: ordered,
      totalShippedPcs: shipped,
      totalRemainingPcs: remaining,
      topProducts: top,
    };
  }, [activeOrders]);

  const getHumanStatus = (status) => {
    switch (status) {
      case 'PARTIALLY_DELIVERED':
        return { text: 'Terkirim Sebagian', cls: 'badge-warning' };
      case 'COMPLETED':
        return { text: 'Selesai', cls: 'badge-completed' };
      case 'CANCELLED':
        return { text: 'Dibatalkan', cls: 'badge-danger' };
      default:
        return { text: 'Aktif Diproses', cls: 'badge-production' };
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Memuat data dashboard...</div>;
  }

  // Filter orders for recent display
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="content-body">
      {/* Low Stock Alert Banner (for Owner/Admin) */}
      {(role === 'OWNER' || role === 'SUPER_ADMIN') && lowStockItems.length > 0 && (
        <div className="alert-banner alert-warning">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={24} color="#d97706" />
            <div>
              <div style={{ fontWeight: 700 }}>
                Peringatan Stok Rendah ({lowStockItems.length} Bahan/Barang Mendekati Habis)
              </div>
              <div style={{ fontSize: '0.825rem', marginTop: '2px' }}>
                Bahan berikut berada di bawah batas minimum: {lowStockItems.map((i) => `${i.name} (${i.quantity} ${i.unit})`).join(', ')}.
              </div>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('inventory')}>
            Lihat Inventori
          </button>
        </div>
      )}

      {/* Customer Hero Banner */}
      {role === 'CUSTOMER' && (
        <div
          className="grid-mobile-stack"
          style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #312e81 100%)',
            borderRadius: '16px',
            padding: '24px',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
            boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: '1', minWidth: '220px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
              Selamat Datang, {user?.name}!
            </h2>
            <p style={{ opacity: 0.9, fontSize: '0.85rem', marginTop: '4px' }}>
              Ajukan pesanan seragam baru untuk sekolah/instansi Anda, pantau progres pengerjaan konveksi secara real-time, dan cetak bukti pemesanan.
            </p>
          </div>
          <button
            className="btn btn-success"
            style={{ padding: '10px 18px', fontSize: '0.9rem', width: 'auto' }}
            onClick={() => onNavigate('order-request')}
          >
            <PlusCircle size={18} />
            <span>Buat Pesanan Baru</span>
          </button>
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="stats-grid">
        {role === 'CUSTOMER' ? (
          <>
            <div className="stat-card" style={{ '--stat-accent': '#4f46e5', '--stat-bg': '#eef2ff' }}>
              <div>
                <div className="stat-label">Total Pesanan Saya</div>
                <div className="stat-value">{orders.length}</div>
                <div className="stat-subtitle">Sepanjang masa</div>
              </div>
              <div className="stat-icon-wrapper">
                <ShoppingBag size={22} />
              </div>
            </div>

            <div className="stat-card" style={{ '--stat-accent': '#f59e0b', '--stat-bg': '#fffbeb' }}>
              <div>
                <div className="stat-label">Sedang Diproses</div>
                <div className="stat-value">
                  {orders.filter((o) => ['REQUESTED', 'CONFIRMED', 'PRODUCTION'].includes(o.status)).length}
                </div>
                <div className="stat-subtitle">Dalam antrean & jahit</div>
              </div>
              <div className="stat-icon-wrapper">
                <Clock size={22} />
              </div>
            </div>

            <div className="stat-card" style={{ '--stat-accent': '#0284c7', '--stat-bg': '#e0f2fe' }}>
              <div>
                <div className="stat-label">Siap / Dikirim</div>
                <div className="stat-value">
                  {orders.filter((o) => ['READY', 'DELIVERING'].includes(o.status)).length}
                </div>
                <div className="stat-subtitle">Pengiriman ke lokasi</div>
              </div>
              <div className="stat-icon-wrapper">
                <Truck size={22} />
              </div>
            </div>

            <div className="stat-card" style={{ '--stat-accent': '#10b981', '--stat-bg': '#ecfdf5' }}>
              <div>
                <div className="stat-label">Selesai</div>
                <div className="stat-value">
                  {orders.filter((o) => o.status === 'COMPLETED').length}
                </div>
                <div className="stat-subtitle">Pesanan diterima</div>
              </div>
              <div className="stat-icon-wrapper">
                <CheckCircle2 size={22} />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* OWNER & SUPER ADMIN STATS - Practical Konveksi Metrics */}
            <div className="stat-card" style={{ '--stat-accent': '#6366f1', '--stat-bg': '#eef2ff' }}>
              <div>
                <div className="stat-label">Pesanan Aktif (PO)</div>
                <div className="stat-value">{activeOrders.length}</div>
                <div className="stat-subtitle">{totalActivePcs} pcs total dipesan</div>
              </div>
              <div className="stat-icon-wrapper">
                <ShoppingBag size={22} />
              </div>
            </div>

            <div className="stat-card" style={{ '--stat-accent': '#f59e0b', '--stat-bg': '#fffbeb' }}>
              <div>
                <div className="stat-label">Sisa Antrean Jahit / Kirim</div>
                <div className="stat-value" style={{ color: totalRemainingPcs > 0 ? '#d97706' : '#10b981' }}>
                  {totalRemainingPcs} <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>pcs</span>
                </div>
                <div className="stat-subtitle">{totalShippedPcs} pcs sudah terkirim</div>
              </div>
              <div className="stat-icon-wrapper">
                <Scissors size={22} />
              </div>
            </div>

            <div className="stat-card" style={{ '--stat-accent': '#10b981', '--stat-bg': '#ecfdf5' }}>
              <div>
                <div className="stat-label">Total Omset Selesai</div>
                <div className="stat-value" style={{ fontSize: '1.35rem' }}>
                  Rp {(stats?.completedRevenue || 0).toLocaleString('id-ID')}
                </div>
                <div className="stat-subtitle">Dari pesanan lunas</div>
              </div>
              <div className="stat-icon-wrapper">
                <DollarSign size={22} />
              </div>
            </div>

            <div className="stat-card" style={{ '--stat-accent': '#0284c7', '--stat-bg': '#e0f2fe' }}>
              <div>
                <div className="stat-label">Estimasi Profit Bersih</div>
                <div className="stat-value" style={{ fontSize: '1.35rem', color: (stats?.estimatedProfit || 0) >= 0 ? '#059669' : '#dc2626' }}>
                  Rp {(stats?.estimatedProfit || 0).toLocaleString('id-ID')}
                </div>
                <div className="stat-subtitle">Omset - Biaya Bahan & Jahit</div>
              </div>
              <div className="stat-icon-wrapper">
                <TrendingUp size={22} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Ringkasan Antrean Produksi Aktif per Seragam (Owner / Admin) */}
      {(role === 'OWNER' || role === 'SUPER_ADMIN') && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} color="#4f46e5" />
                Antrean Produksi & Sisa Kirim Seragam (WIP)
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Ringkasan produk yang sedang aktif dikerjakan dan belum selesai dikirim ke customer
              </p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('orders')}>
              <span>Buka Rekap Produk Pesanan</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {topProducts.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '10px' }}>
              Tidak ada antrean seragam aktif saat ini. Semua pesanan telah selesai dikirim.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
              {topProducts.map((p) => {
                const percent = p.total_ordered > 0 ? Math.round((p.total_shipped / p.total_ordered) * 100) : 0;
                return (
                  <div
                    key={p.product_name}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>
                          {p.product_name}
                        </div>
                        <span
                          style={{
                            background: p.total_remaining > 0 ? '#fef3c7' : '#dcfce7',
                            color: p.total_remaining > 0 ? '#b45309' : '#15803d',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '20px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Sisa: {p.total_remaining} pcs
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '12px' }}>
                        {p.category} &bull; Tersebar di {p.orders_count} PO Aktif
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
                        <span>Terkirim: {p.total_shipped} / {p.total_ordered} pcs</span>
                        <span style={{ fontWeight: 700, color: '#334155' }}>{percent}%</span>
                      </div>
                      <div style={{ height: '7px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${percent}%`,
                            background: percent === 100 ? '#10b981' : '#6366f1',
                            borderRadius: '4px',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Recent Orders Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
              {role === 'CUSTOMER' ? 'Pesanan Terakhir Saya' : 'Pesanan Terbaru Masuk'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Daftar transaksi pesanan seragam terkini
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('orders')}>
            Lihat Semua Pesanan
          </button>
        </div>

        {/* Desktop Table View */}
        <div className="desktop-only-table">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>No. Order</th>
                  <th>Lembaga / Customer</th>
                  <th>Tanggal</th>
                  <th className="text-right">Total Nilai</th>
                  <th>Status</th>
                  <th className="text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                      Belum ada pesanan yang tercatat.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((ord) => (
                    <tr key={ord.id}>
                      <td className="font-mono" style={{ fontWeight: 700, color: '#4f46e5' }}>
                        {ord.order_number}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{ord.customer_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {ord.items?.length || 0} item varian
                        </div>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {new Date(ord.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="text-right font-mono" style={{ fontWeight: 700 }}>
                        Rp {Number(ord.total_amount).toLocaleString('id-ID')}
                      </td>
                      <td>
                        {(() => {
                          const st = getHumanStatus(ord.status);
                          return (
                            <span className={`badge ${st.cls}`}>
                              <span className="badge-dot"></span>
                              {st.text}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="text-center">
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            className="btn btn-secondary btn-sm btn-icon"
                            title="Lihat Detail & Riwayat"
                            onClick={() => onViewOrder(ord)}
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            className="btn btn-secondary btn-sm btn-icon"
                            title="Cetak Bukti Pemesanan"
                            onClick={() => onViewReceipt(ord)}
                          >
                            <FileText size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards View */}
        <div className="mobile-only-cards">
          {recentOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
              Belum ada pesanan yang tercatat.
            </div>
          ) : (
            recentOrders.map((ord) => (
              <div key={ord.id} className="mobile-data-card">
                <div className="mobile-data-card-header">
                  <div>
                    <div className="mobile-data-card-code">{ord.order_number}</div>
                    <div className="mobile-data-card-title">{ord.customer_name}</div>
                    <div className="mobile-data-card-sub">{ord.items?.length || 0} item varian seragam</div>
                  </div>
                  {(() => {
                    const st = getHumanStatus(ord.status);
                    return (
                      <span className={`badge ${st.cls}`}>
                        <span className="badge-dot"></span>
                        {st.text}
                      </span>
                    );
                  })()}
                </div>

                <div className="mobile-data-card-grid">
                  <div className="mobile-data-card-field">
                    <span className="mobile-data-card-label">Tanggal Order</span>
                    <span className="mobile-data-card-val" style={{ fontSize: '0.825rem' }}>
                      {new Date(ord.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="mobile-data-card-field">
                    <span className="mobile-data-card-label">Total Nilai PO</span>
                    <span className="mobile-data-card-val font-mono" style={{ color: '#4f46e5' }}>
                      Rp {Number(ord.total_amount).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <div className="mobile-data-card-actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onViewOrder(ord)}
                  >
                    <Eye size={15} />
                    <span>Lihat Detail</span>
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onViewReceipt(ord)}
                  >
                    <FileText size={15} />
                    <span>Bukti PO</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
