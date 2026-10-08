import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  PlusCircle,
  Eye,
  FileText,
  CheckCircle,
  Clock,
  ArrowRight,
  Truck,
  RotateCcw,
  Send,
  X,
  AlertCircle,
  Package,
  Layers,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  Scissors,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getHumanStatusLabel } from '../components/OrderDetailModal';

export default function OrdersView({ onNavigate, onViewOrder, onViewReceipt, onViewDeliveryInvoice }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState('orders'); // 'orders' or 'products-summary'
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [expandedProductKey, setExpandedProductKey] = useState(null);

  // Partial shipment modal states
  const [showShipModal, setShowShipModal] = useState(false);
  const [selectedOrderForShip, setSelectedOrderForShip] = useState(null);
  const [shipItems, setShipItems] = useState({});
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryMethod, setDeliveryMethod] = useState('Kurir Konveksi (Mobil Grand Max)');
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [picName, setPicName] = useState('');
  const [notes, setNotes] = useState('');
  const [shipSubmitting, setShipSubmitting] = useState(false);
  const [shipError, setShipError] = useState('');

  const role = user?.role;
  const isOwner = role === 'OWNER' || role === 'SUPER_ADMIN';

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const url = role === 'CUSTOMER' ? `/api/orders?customer_id=${user.customer_id}` : '/api/orders';
      const res = await fetch(url);
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [role, user]);

  // Active orders (in-progress, pending, or partially delivered)
  const activeOrders = useMemo(() => {
    return orders.filter((o) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED');
  }, [orders]);

  // Aggregated summary of all active order items by product type & size
  const productsSummary = useMemo(() => {
    const map = {};
    activeOrders.forEach((ord) => {
      (ord.items || []).forEach((it) => {
        const key = it.product_id || it.product_name;
        if (!map[key]) {
          map[key] = {
            product_id: it.product_id,
            product_name: it.product_name,
            total_ordered: 0,
            total_shipped: 0,
            total_remaining: 0,
            sizes: {},
            ordersMap: {},
          };
        }
        const p = map[key];
        const qty = Number(it.quantity) || 0;
        const shipped = Number(it.shipped_quantity) || 0;
        const remaining = Math.max(0, qty - shipped);

        p.total_ordered += qty;
        p.total_shipped += shipped;
        p.total_remaining += remaining;

        const szKey = it.size_code || it.size_name || 'Standar';
        if (!p.sizes[szKey]) {
          p.sizes[szKey] = {
            size_code: szKey,
            size_name: it.size_name || `Size ${szKey}`,
            ordered: 0,
            shipped: 0,
            remaining: 0,
          };
        }
        p.sizes[szKey].ordered += qty;
        p.sizes[szKey].shipped += shipped;
        p.sizes[szKey].remaining += remaining;

        if (!p.ordersMap[ord.id]) {
          p.ordersMap[ord.id] = {
            order: ord,
            order_id: ord.id,
            order_number: ord.order_number,
            customer_name: ord.customer_name,
            created_at: ord.created_at,
            status: ord.status,
            total_ordered: 0,
            total_shipped: 0,
            total_remaining: 0,
            size_details: [],
          };
        }
        p.ordersMap[ord.id].total_ordered += qty;
        p.ordersMap[ord.id].total_shipped += shipped;
        p.ordersMap[ord.id].total_remaining += remaining;
        p.ordersMap[ord.id].size_details.push({
          size_code: szKey,
          quantity: qty,
          shipped_quantity: shipped,
          remaining_quantity: remaining,
        });
      });
    });

    return Object.values(map)
      .map((p) => ({
        ...p,
        sizesList: Object.values(p.sizes).sort((a, b) => a.size_code.localeCompare(b.size_code)),
        contributingOrders: Object.values(p.ordersMap),
      }))
      .sort((a, b) => b.total_remaining - a.total_remaining); // Sort highest remaining pieces first
  }, [activeOrders]);

  const filteredProductsSummary = useMemo(() => {
    if (!productSearchQuery.trim()) return productsSummary;
    return productsSummary.filter((p) =>
      p.product_name.toLowerCase().includes(productSearchQuery.toLowerCase())
    );
  }, [productsSummary, productSearchQuery]);

  const totalActiveOrderedPcs = productsSummary.reduce((acc, p) => acc + p.total_ordered, 0);
  const totalActiveShippedPcs = productsSummary.reduce((acc, p) => acc + p.total_shipped, 0);
  const totalActiveRemainingPcs = productsSummary.reduce((acc, p) => acc + p.total_remaining, 0);

  // Shipment handlers
  const openShipmentModal = async (order) => {
    try {
      const res = await fetch(`/api/orders/${order.id}`);
      const fullOrder = await res.json();
      setSelectedOrderForShip(fullOrder);
      setRecipientName(fullOrder.customer_name || '');
      setPhone(fullOrder.customer_phone || '');
      setAddress(fullOrder.shipping_address || '');
      setPicName(user?.name || '');
      setNotes('');
      setDeliveryDate(new Date().toISOString().split('T')[0]);
      setDeliveryMethod('Kurir Konveksi (Mobil Grand Max)');
      setShipError('');

      const initialMap = {};
      (fullOrder.items || []).forEach((it) => {
        initialMap[it.id] = 0; // Default pengiriman 0 pcs
      });
      setShipItems(initialMap);
      setShowShipModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleQtyChange = (itemId, val, maxVal) => {
    const num = Math.max(0, Math.min(Number(val) || 0, maxVal));
    setShipItems((prev) => ({ ...prev, [itemId]: num }));
  };

  const handleShipAllRemaining = () => {
    if (!selectedOrderForShip) return;
    const map = {};
    (selectedOrderForShip.items || []).forEach((it) => {
      const remaining = it.remaining_quantity !== undefined ? it.remaining_quantity : it.quantity;
      map[it.id] = remaining;
    });
    setShipItems(map);
  };

  const handleResetAllToZero = () => {
    if (!selectedOrderForShip) return;
    const map = {};
    (selectedOrderForShip.items || []).forEach((it) => {
      map[it.id] = 0;
    });
    setShipItems(map);
  };

  const handleCreateShipment = async (e) => {
    e.preventDefault();
    if (!selectedOrderForShip) return;
    setShipError('');

    const itemsToShip = Object.entries(shipItems)
      .map(([order_item_id, quantity_shipped]) => ({
        order_item_id,
        quantity_shipped: Number(quantity_shipped),
      }))
      .filter((it) => it.quantity_shipped > 0);

    if (itemsToShip.length === 0) {
      setShipError('Masukkan minimal 1 barang dengan kuantitas kirim lebih dari 0 pcs.');
      return;
    }

    setShipSubmitting(true);
    try {
      const payload = {
        order_id: selectedOrderForShip.id,
        delivery_date: deliveryDate,
        delivery_method: deliveryMethod,
        recipient_name: recipientName,
        phone,
        address,
        pic_name: picName,
        notes,
        items: itemsToShip,
        created_by: user.name,
      };

      const res = await fetch('/api/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal membuat pengiriman');
      }

      setShowShipModal(false);
      await fetchOrders();

      // Automatically open the generated Faktur Pengiriman
      if (onViewDeliveryInvoice) {
        onViewDeliveryInvoice(data.delivery);
      }
    } catch (err) {
      setShipError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setShipSubmitting(false);
    }
  };

  // Filter logic for PO list
  const filteredOrders = orders.filter((ord) => {
    let matchStatus = true;
    if (statusFilter === 'CONFIRMED') {
      matchStatus = ['CONFIRMED', 'REQUESTED', 'PRODUCTION', 'READY', 'DELIVERING'].includes(ord.status);
    } else if (statusFilter === 'PARTIALLY_DELIVERED') {
      matchStatus = ord.status === 'PARTIALLY_DELIVERED' || ord.is_partially_delivered;
    } else if (statusFilter === 'COMPLETED') {
      matchStatus = ord.status === 'COMPLETED';
    }
    const matchSearch =
      ord.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.customer_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="content-body">
      <div className="card">
        {/* Top Controls */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '16px',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              {role === 'CUSTOMER' ? 'Daftar Pesanan Saya' : 'Manajemen Seluruh Pesanan & Produksi'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              {mainTab === 'orders'
                ? `Total ${filteredOrders.length} faktur pesanan ditemukan`
                : `Total ${productsSummary.length} model seragam aktif (${totalActiveRemainingPcs} pcs sisa antrean)`}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary btn-sm" onClick={fetchOrders} title="Muat ulang data">
              <RotateCcw size={15} />
            </button>
            {/* Hanya ditampilkan untuk customer */}
            {role === 'CUSTOMER' && (
              <button className="btn btn-primary btn-sm" onClick={() => onNavigate('order-request')}>
                <PlusCircle size={15} />
                <span>Buat Pesanan Baru</span>
              </button>
            )}
          </div>
        </div>

        {/* MAIN VIEW SWITCHER: PER PO VS REKAP PER JENIS PRODUK */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '18px',
            borderBottom: '1px solid #f1f5f9',
            paddingBottom: '12px',
          }}
        >
          <button
            className={`btn btn-sm ${mainTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMainTab('orders')}
          >
            <ShoppingBag size={15} />
            <span>Faktur / PO Pesanan ({orders.length})</span>
          </button>

          <button
            className={`btn btn-sm ${mainTab === 'products-summary' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMainTab('products-summary')}
            style={mainTab === 'products-summary' ? { background: '#4338ca', borderColor: '#4338ca' } : {}}
          >
            <Package size={15} />
            <span>Rekap Total per Jenis Produk ({productsSummary.length} Aktif)</span>
          </button>
        </div>

        {/* TAB 1: DAFTAR PER FAKTUR / PO PESANAN */}
        {mainTab === 'orders' && (
          <>
            {/* Filter Tabs & Search Bar */}
        <div
          className="grid-mobile-stack"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            paddingBottom: '14px',
            borderBottom: '1px solid #f1f5f9',
            marginBottom: '18px',
          }}
        >
          {/* Status Tabs with smooth touch scrolling */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              paddingBottom: '4px',
              maxWidth: '100%',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {[
              { key: 'ALL', label: 'Semua' },
              { key: 'CONFIRMED', label: 'Terkonfirmasi' },
              { key: 'PARTIALLY_DELIVERED', label: 'Terkirim Sebagian' },
              { key: 'COMPLETED', label: 'Selesai' },
            ].map((tab) => (
              <button
                key={tab.key}
                className={`btn btn-sm ${statusFilter === tab.key ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '5px 12px', flexShrink: 0 }}
                onClick={() => setStatusFilter(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '300px', flex: '1', minWidth: '180px' }}>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '36px', height: '38px', fontSize: '0.85rem' }}
              placeholder="Cari No. Order / Lembaga..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search
              size={16}
              style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8' }}
            />
          </div>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Memuat data pesanan...</div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
            Tidak ada pesanan yang sesuai dengan filter.
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="desktop-only-table">
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>No. Order</th>
                      <th>Customer / Lembaga</th>
                      <th>Tanggal Order</th>
                      <th className="text-right">Kuantitas PO & Terkirim</th>
                      <th className="text-right">Total Biaya</th>
                      <th>Status Progres</th>
                      <th className="text-center" style={{ minWidth: '190px' }}>
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((ord) => {
                      const totalPcs = ord.total_ordered_pcs !== undefined ? ord.total_ordered_pcs : (ord.items || []).reduce((acc, curr) => acc + curr.quantity, 0);
                      const totalShipped = ord.total_shipped_pcs || 0;
                      const totalRemaining = ord.total_remaining_pcs !== undefined ? ord.total_remaining_pcs : Math.max(0, totalPcs - totalShipped);

                      return (
                        <tr key={ord.id}>
                          <td className="font-mono" style={{ fontWeight: 700, color: '#4f46e5' }}>
                            {ord.order_number}
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{ord.customer_name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              {ord.customer_phone || '-'}
                            </div>
                          </td>
                          <td style={{ fontSize: '0.85rem' }}>
                            {new Date(ord.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="text-right font-mono">
                            <div style={{ fontWeight: 700 }}>
                              {totalShipped > 0 ? (
                                <span>
                                  <span style={{ color: '#10b981' }}>{totalShipped}</span> / {totalPcs} pcs
                                </span>
                              ) : (
                                <span>{totalPcs} pcs</span>
                              )}
                            </div>
                            {totalShipped > 0 && totalRemaining > 0 && (
                              <div style={{ fontSize: '0.7rem', color: '#d97706', fontWeight: 600 }}>
                                Sisa: {totalRemaining} pcs
                              </div>
                            )}
                          </td>
                          <td
                            className="text-right font-mono"
                            style={{ fontWeight: 700, color: '#0f172a' }}
                          >
                            Rp {Number(ord.total_amount).toLocaleString('id-ID')}
                          </td>
                          <td>
                            <span className={`badge badge-${ord.status}`}>
                              <span className="badge-dot"></span>
                              {getHumanStatusLabel(ord.status)}
                            </span>
                          </td>
                          <td className="text-center">
                            <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                              <button
                                className="btn btn-secondary btn-sm btn-icon"
                                title="Buka Detail & Timeline"
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

                              {/* Kirim Sebagian button for Owner if remaining pcs > 0 */}
                              {isOwner && totalRemaining > 0 && ord.status !== 'CANCELLED' && ord.status !== 'COMPLETED' && (
                                <button
                                  className="btn btn-primary btn-sm"
                                  style={{ fontSize: '0.75rem', padding: '5px 10px', background: '#4338ca' }}
                                  title="Kirim Barang Bertahap & Terbitkan Faktur"
                                  onClick={() => openShipmentModal(ord)}
                                >
                                  <Send size={13} />
                                  <span>Kirim Sebagian</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards View (Thumb-Friendly, No Horizontal Scrolling) */}
            <div className="mobile-only-cards">
              {filteredOrders.map((ord) => {
                const totalPcs = ord.total_ordered_pcs !== undefined ? ord.total_ordered_pcs : (ord.items || []).reduce((acc, curr) => acc + curr.quantity, 0);
                const totalShipped = ord.total_shipped_pcs || 0;
                const totalRemaining = ord.total_remaining_pcs !== undefined ? ord.total_remaining_pcs : Math.max(0, totalPcs - totalShipped);

                return (
                  <div key={ord.id} className="mobile-data-card">
                    {/* Header: Order Number & Status */}
                    <div className="mobile-data-card-header">
                      <div>
                        <div className="mobile-data-card-code">{ord.order_number}</div>
                        <div className="mobile-data-card-title">{ord.customer_name}</div>
                        {ord.customer_phone && (
                          <div className="mobile-data-card-sub">{ord.customer_phone}</div>
                        )}
                      </div>
                      <span className={`badge badge-${ord.status}`}>
                        <span className="badge-dot"></span>
                        {getHumanStatusLabel(ord.status)}
                      </span>
                    </div>

                    {/* Key Metrics Grid */}
                    <div className="mobile-data-card-grid">
                      <div className="mobile-data-card-field">
                        <span className="mobile-data-card-label">Tanggal Order</span>
                        <span className="mobile-data-card-val" style={{ fontWeight: 600, fontSize: '0.825rem' }}>
                          {new Date(ord.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="mobile-data-card-field">
                        <span className="mobile-data-card-label">Total Biaya PO</span>
                        <span className="mobile-data-card-val font-mono" style={{ color: '#4f46e5' }}>
                          Rp {Number(ord.total_amount).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="mobile-data-card-field">
                        <span className="mobile-data-card-label">Total Pesanan</span>
                        <span className="mobile-data-card-val font-mono">{totalPcs} pcs</span>
                      </div>
                      <div className="mobile-data-card-field">
                        <span className="mobile-data-card-label">Status Kirim</span>
                        <span className="mobile-data-card-val font-mono">
                          {totalShipped > 0 ? (
                            <span>
                              <span style={{ color: '#10b981' }}>{totalShipped}</span> / {totalPcs} pcs
                              {totalRemaining > 0 && (
                                <div style={{ fontSize: '0.7rem', color: '#d97706', fontWeight: 600 }}>
                                  (Sisa: {totalRemaining} pcs)
                                </div>
                              )}
                            </span>
                          ) : (
                            <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Belum dikirim</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Touch Friendly Action Buttons */}
                    <div className="mobile-data-card-actions">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => onViewOrder(ord)}
                      >
                        <Eye size={15} />
                        <span>Detail & Alur</span>
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => onViewReceipt(ord)}
                      >
                        <FileText size={15} />
                        <span>Bukti PO</span>
                      </button>

                      {/* Kirim Sebagian button for Owner */}
                      {isOwner && totalRemaining > 0 && ord.status !== 'CANCELLED' && ord.status !== 'COMPLETED' && (
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ background: '#4338ca', width: '100%', flexBasis: '100%' }}
                          onClick={() => openShipmentModal(ord)}
                        >
                          <Send size={14} />
                          <span>Kirim Sebagian (Faktur)</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
          </>
        )}

        {/* TAB 2: REKAP TOTAL PER JENIS PRODUK (SELURUH PESANAN AKTIF) */}
        {mainTab === 'products-summary' && (
          <div>
            {/* KPI Summary Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #c7d2fe',
                }}
              >
                <div style={{ fontSize: '0.8rem', color: '#4338ca', fontWeight: 700 }}>
                  Sisa Antrean Jahit / Kirim
                </div>
                <div className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#312e81', marginTop: '4px' }}>
                  {totalActiveRemainingPcs.toLocaleString('id-ID')} <span style={{ fontSize: '0.9rem' }}>pcs</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#4338ca', marginTop: '2px' }}>
                  Belum dikirim ke pemesan
                </div>
              </div>

              <div
                style={{
                  background: '#f8fafc',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>
                  Total Pesanan Masuk (PO Aktif)
                </div>
                <div className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                  {totalActiveOrderedPcs.toLocaleString('id-ID')} <span style={{ fontSize: '0.9rem' }}>pcs</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                  Dari {activeOrders.length} faktur pesanan aktif
                </div>
              </div>

              <div
                style={{
                  background: '#f0fdf4',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #bbf7d0',
                }}
              >
                <div style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: 700 }}>
                  Sudah Terkirim (Sebagian)
                </div>
                <div className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#166534', marginTop: '4px' }}>
                  {totalActiveShippedPcs.toLocaleString('id-ID')} <span style={{ fontSize: '0.9rem' }}>pcs</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '2px' }}>
                  Barang sudah sampai di customer
                </div>
              </div>

              <div
                style={{
                  background: '#f8fafc',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>
                  Model Seragam Dikerjakan
                </div>
                <div className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                  {productsSummary.length} <span style={{ fontSize: '0.9rem' }}>model</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                  Sedang dalam lini produksi
                </div>
              </div>
            </div>

            {/* Search Input for Products */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '34px', fontSize: '0.85rem' }}
                  placeholder="Cari nama seragam..."
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                />
                <Search
                  size={15}
                  style={{ position: 'absolute', left: '10px', top: '12px', color: '#94a3b8' }}
                />
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Menampilkan <strong>{filteredProductsSummary.length}</strong> jenis seragam yang membutuhkan produksi / pengiriman.
              </div>
            </div>

            {filteredProductsSummary.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '12px' }}>
                <CheckCircle size={36} color="#10b981" style={{ margin: '0 auto 12px' }} />
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a' }}>
                  Tidak Ada Antrean Produksi Aktif!
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                  Semua pesanan seragam telah selesai dan terkirim seluruhnya ke pemesan.
                </div>
              </div>
            ) : (
              <>
                {/* Desktop Table: Product Summary */}
                <div className="desktop-only-table">
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Produk Seragam</th>
                          <th className="text-right">Total Order</th>
                          <th className="text-right">Terkirim</th>
                          <th className="text-right">Sisa Antrean Jahit</th>
                          <th>Rincian per Ukuran (Size)</th>
                          <th>Pemesan Yang Menunggu</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProductsSummary.map((p, idx) => {
                          const percentShipped = p.total_ordered > 0 ? Math.round((p.total_shipped / p.total_ordered) * 100) : 0;
                          return (
                            <tr key={idx} style={{ verticalAlign: 'top' }}>
                              <td>
                                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
                                  {p.product_name}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                                  Tersebar di <strong>{p.contributingOrders.length}</strong> pesanan pemesan
                                </div>
                                <div style={{ marginTop: '8px', maxWidth: '140px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', marginBottom: '2px' }}>
                                    <span>Terkirim: {percentShipped}%</span>
                                  </div>
                                  <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ width: `${percentShipped}%`, height: '100%', background: '#4f46e5' }}></div>
                                  </div>
                                </div>
                              </td>

                              <td className="text-right font-mono" style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                                {p.total_ordered.toLocaleString('id-ID')} pcs
                              </td>

                              <td className="text-right font-mono" style={{ color: '#059669', fontWeight: 600 }}>
                                {p.total_shipped.toLocaleString('id-ID')} pcs
                              </td>

                              <td className="text-right font-mono">
                                <span
                                  style={{
                                    fontSize: '1.15rem',
                                    fontWeight: 900,
                                    color: p.total_remaining > 0 ? '#4338ca' : '#10b981',
                                  }}
                                >
                                  {p.total_remaining.toLocaleString('id-ID')} pcs
                                </span>
                              </td>

                              <td>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                  {p.sizesList.map((sz) => (
                                    <div
                                      key={sz.size_code}
                                      style={{
                                        background: sz.remaining > 0 ? '#eef2ff' : '#f1f5f9',
                                        border: sz.remaining > 0 ? '1px solid #c7d2fe' : '1px solid #e2e8f0',
                                        borderRadius: '6px',
                                        padding: '4px 8px',
                                        fontSize: '0.75rem',
                                      }}
                                    >
                                      <div style={{ fontWeight: 700, color: sz.remaining > 0 ? '#312e81' : '#64748b' }}>
                                        {sz.size_name || `Size ${sz.size_code}`}
                                      </div>
                                      <div style={{ fontSize: '0.7rem', color: sz.remaining > 0 ? '#4338ca' : '#94a3b8' }}>
                                        Sisa: <strong>{sz.remaining}</strong> / {sz.ordered} pcs
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </td>

                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  {p.contributingOrders.map((ordInfo) => (
                                    <div
                                      key={ordInfo.order_id}
                                      style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        background: '#f8fafc',
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        fontSize: '0.75rem',
                                        border: '1px solid #f1f5f9',
                                      }}
                                    >
                                      <div>
                                        <span className="font-mono" style={{ fontWeight: 700, color: '#4f46e5' }}>
                                          {ordInfo.order_number}
                                        </span>{' '}
                                        - {ordInfo.customer_name}
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span className="font-mono" style={{ fontWeight: 700, color: ordInfo.total_remaining > 0 ? '#d97706' : '#059669' }}>
                                          {ordInfo.total_remaining} pcs sisa
                                        </span>
                                        {isOwner && ordInfo.total_remaining > 0 && (
                                          <button
                                            className="btn btn-secondary btn-sm btn-icon"
                                            style={{ height: '22px', width: '22px', padding: 0 }}
                                            title="Kirim Pesanan Ini"
                                            onClick={() => openShipmentModal(ordInfo.order)}
                                          >
                                            <Send size={11} />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Cards: Product Summary */}
                <div className="mobile-only-cards">
                  {filteredProductsSummary.map((p, idx) => {
                    const percentShipped = p.total_ordered > 0 ? Math.round((p.total_shipped / p.total_ordered) * 100) : 0;
                    return (
                      <div key={idx} className="mobile-data-card" style={{ borderLeft: '4px solid #4f46e5' }}>
                        <div className="mobile-data-card-header">
                          <div>
                            <div className="mobile-data-card-title" style={{ fontSize: '1rem' }}>
                              {p.product_name}
                            </div>
                            <div className="mobile-data-card-sub">
                              Tersebar di {p.contributingOrders.length} faktur pemesan
                            </div>
                          </div>
                          <span
                            className="badge"
                            style={{
                              background: '#e0e7ff',
                              color: '#312e81',
                              fontWeight: 800,
                              fontSize: '0.8rem',
                            }}
                          >
                            Sisa: {p.total_remaining} pcs
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
                            <span>Terkirim: {p.total_shipped} pcs ({percentShipped}%)</span>
                            <span>Total: {p.total_ordered} pcs</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${percentShipped}%`, height: '100%', background: '#4f46e5' }}></div>
                          </div>
                        </div>

                        {/* Size Breakdown */}
                        <div style={{ marginBottom: '12px' }}>
                          <span className="mobile-data-card-label" style={{ display: 'block', marginBottom: '6px' }}>
                            Rincian per Ukuran:
                          </span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {p.sizesList.map((sz) => (
                              <div
                                key={sz.size_code}
                                style={{
                                  background: sz.remaining > 0 ? '#eef2ff' : '#f8fafc',
                                  border: sz.remaining > 0 ? '1px solid #c7d2fe' : '1px solid #e2e8f0',
                                  borderRadius: '6px',
                                  padding: '4px 8px',
                                  fontSize: '0.75rem',
                                }}
                              >
                                <strong>{sz.size_name || `Size ${sz.size_code}`}</strong>: Sisa {sz.remaining} / {sz.ordered} pcs
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Orders Waiting */}
                        <div>
                          <span className="mobile-data-card-label" style={{ display: 'block', marginBottom: '6px' }}>
                            Faktur Pemesan yang Menunggu:
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {p.contributingOrders.map((ordInfo) => (
                              <div
                                key={ordInfo.order_id}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  background: '#f8fafc',
                                  padding: '8px',
                                  borderRadius: '8px',
                                  fontSize: '0.8rem',
                                  border: '1px solid #f1f5f9',
                                }}
                              >
                                <div>
                                  <div className="font-mono" style={{ fontWeight: 700, color: '#4f46e5' }}>
                                    {ordInfo.order_number}
                                  </div>
                                  <div style={{ color: '#475569' }}>{ordInfo.customer_name}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <div className="font-mono" style={{ fontWeight: 700, color: ordInfo.total_remaining > 0 ? '#d97706' : '#059669' }}>
                                    {ordInfo.total_remaining} pcs sisa
                                  </div>
                                  {isOwner && ordInfo.total_remaining > 0 && (
                                    <button
                                      className="btn btn-primary btn-sm"
                                      style={{ fontSize: '0.7rem', padding: '3px 8px', marginTop: '4px' }}
                                      onClick={() => openShipmentModal(ordInfo.order)}
                                    >
                                      Kirim
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* MODAL: FORMULIR PENGIRIMAN BERTAHAP & TERBITKAN FAKTUR DARI MENU PESANAN */}
      {showShipModal && selectedOrderForShip && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <div>
                <div className="modal-title">
                  Kirim Barang Bertahap: <span className="font-mono text-primary">{selectedOrderForShip.order_number}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Customer: <strong>{selectedOrderForShip.customer_name}</strong>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowShipModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateShipment}>
              <div className="modal-body">
                {shipError && (
                  <div
                    style={{
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#b91c1c',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <AlertCircle size={18} />
                    <span>{shipError}</span>
                  </div>
                )}

                {/* Quick actions for setting quantities */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
                    Tentukan Jumlah Yang Ingin Dikirim Kali Ini:
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                      onClick={handleShipAllRemaining}
                    >
                      Kirim Semua Sisa
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                      onClick={handleResetAllToZero}
                    >
                      Reset 0
                    </button>
                  </div>
                </div>

                {/* Table of Items to Ship (Desktop) */}
                <div className="desktop-only-table" style={{ marginBottom: '20px' }}>
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Nama Produk & Varian</th>
                          <th className="text-center" style={{ width: '80px' }}>Total PO</th>
                          <th className="text-center" style={{ width: '90px' }}>Sudah Dikirim</th>
                          <th className="text-center" style={{ width: '90px', color: '#d97706' }}>Sisa PO</th>
                          <th className="text-right" style={{ width: '130px', background: '#e0e7ff', color: '#3730a3' }}>
                            Kirim Kali Ini
                          </th>
                          <th className="text-right" style={{ width: '120px' }}>Sisa Nanti</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedOrderForShip.items || []).map((it) => {
                          const remaining = it.remaining_quantity !== undefined ? it.remaining_quantity : it.quantity;
                          const currentInput = shipItems[it.id] || 0;
                          const sisaSetelahKirim = Math.max(0, remaining - currentInput);

                          return (
                            <tr key={it.id}>
                              <td>
                                <div style={{ fontWeight: 600 }}>{it.product_name}</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                  Ukuran: <strong>{it.size_name || it.size_code || 'N/A'}</strong>
                                </div>
                              </td>
                              <td className="text-center font-mono">{it.quantity} pcs</td>
                              <td className="text-center font-mono" style={{ color: '#10b981' }}>
                                {it.shipped_quantity || 0} pcs
                              </td>
                              <td className="text-center font-mono" style={{ fontWeight: 700, color: '#d97706' }}>
                                {remaining} pcs
                              </td>
                              <td className="text-right" style={{ background: '#f5f3ff' }}>
                                <input
                                  type="number"
                                  min="0"
                                  max={remaining}
                                  className="form-input text-right font-mono"
                                  style={{ width: '90px', padding: '6px 8px', fontWeight: 800, color: '#4f46e5' }}
                                  value={currentInput}
                                  onChange={(e) => handleQtyChange(it.id, e.target.value, remaining)}
                                  disabled={remaining <= 0}
                                />
                              </td>
                              <td className="text-right font-mono" style={{ fontWeight: 600, color: sisaSetelahKirim > 0 ? '#d97706' : '#10b981' }}>
                                {sisaSetelahKirim} pcs
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Cards for Items to Ship */}
                <div className="mobile-only-cards" style={{ marginBottom: '20px' }}>
                  {(selectedOrderForShip.items || []).map((it) => {
                    const remaining = it.remaining_quantity !== undefined ? it.remaining_quantity : it.quantity;
                    const currentInput = shipItems[it.id] || 0;
                    const sisaSetelahKirim = Math.max(0, remaining - currentInput);

                    return (
                      <div key={it.id} className="mobile-data-card" style={{ padding: '14px', background: '#f8fafc' }}>
                        <div className="mobile-data-card-header" style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <div>
                            <div className="mobile-data-card-title">{it.product_name}</div>
                            <div className="mobile-data-card-sub">
                              Ukuran: <strong>{it.size_name || it.size_code || 'All Size'}</strong>
                            </div>
                          </div>
                          <span className="badge" style={{ background: '#e0e7ff', color: '#3730a3' }}>
                            Sisa PO: {remaining} pcs
                          </span>
                        </div>

                        <div className="mobile-data-card-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                          <div className="mobile-data-card-field">
                            <span className="mobile-data-card-label">Total PO</span>
                            <span className="mobile-data-card-val font-mono" style={{ fontSize: '0.8rem' }}>{it.quantity} pcs</span>
                          </div>
                          <div className="mobile-data-card-field">
                            <span className="mobile-data-card-label">Terkirim</span>
                            <span className="mobile-data-card-val font-mono" style={{ fontSize: '0.8rem', color: '#10b981' }}>{it.shipped_quantity || 0} pcs</span>
                          </div>
                          <div className="mobile-data-card-field">
                            <span className="mobile-data-card-label">Sisa Nanti</span>
                            <span className="mobile-data-card-val font-mono" style={{ fontSize: '0.8rem', color: sisaSetelahKirim > 0 ? '#d97706' : '#10b981' }}>
                              {sisaSetelahKirim} pcs
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                            Jumlah Kirim:
                          </label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="number"
                              min="0"
                              max={remaining}
                              className="form-input text-center font-mono"
                              style={{ width: '90px', padding: '6px 8px', fontWeight: 800, fontSize: '1rem', color: '#4f46e5' }}
                              value={currentInput}
                              onChange={(e) => handleQtyChange(it.id, e.target.value, remaining)}
                              disabled={remaining <= 0}
                            />
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>pcs</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Delivery Logistics Details */}
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px' }}>
                    Data Ekspedisi & Pengantaran:
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="form-group">
                      <label className="form-label">Tanggal Pengiriman</label>
                      <input
                        type="date"
                        className="form-input"
                        value={deliveryDate}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Metode / Armada Pengiriman</label>
                      <select
                        className="form-select"
                        value={deliveryMethod}
                        onChange={(e) => setDeliveryMethod(e.target.value)}
                      >
                        <option value="Kurir Konveksi (Mobil Grand Max)">Kurir Konveksi (Mobil Grand Max)</option>
                        <option value="Kurir Motor Operasional">Kurir Motor Operasional</option>
                        <option value="JNE / J&T Cargo">JNE / J&T Cargo</option>
                        <option value="Diambil Sendiri oleh Pemesan">Diambil Sendiri oleh Pemesan</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="form-group">
                      <label className="form-label">Nama Driver / PIC Pengantar</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Contoh: Budi Santoso"
                        value={picName}
                        onChange={(e) => setPicName(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Nama Penerima di Lokasi</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Contoh: Ibu Lina (Kesiswaan)"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Alamat Lengkap Tujuan</label>
                    <input
                      type="text"
                      className="form-input"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Catatan Pengiriman</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Contoh: Pengiriman tahap 1 untuk dipakai upacara hari senin"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowShipModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={shipSubmitting}>
                  <Send size={16} />
                  <span>{shipSubmitting ? 'Memproses...' : 'Kirim Barang & Terbitkan Faktur'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
