import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  History,
  CheckCircle,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function InventoryView() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stock'); // 'stock' or 'movements'

  // Modals
  const [showItemModal, setShowItemModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // New Item Form
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Bahan Baku');
  const [quantity, setQuantity] = useState(50);
  const [unit, setUnit] = useState('meter');
  const [minStock, setMinStock] = useState(20);
  const [location, setLocation] = useState('Rak Bahan A1');
  const [costPerUnit, setCostPerUnit] = useState(35000);

  // Stock Movement Form
  const [movementType, setMovementType] = useState('PURCHASE');
  const [movementQty, setMovementQty] = useState(20);
  const [movementNotes, setMovementNotes] = useState('');
  const [recordExpense, setRecordExpense] = useState(true);
  const [supplierName, setSupplierName] = useState('Toko Tekstil');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, movRes] = await Promise.all([
        fetch('/api/inventory'),
        fetch('/api/inventory/movements'),
      ]);
      const [invData, movData] = await Promise.all([invRes.json(), movRes.json()]);
      setItems(invData);
      setMovements(movData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateItem = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          sku,
          category,
          quantity: Number(quantity),
          unit,
          min_stock: Number(minStock),
          location,
          cost_per_unit: Number(costPerUnit),
        }),
      });
      if (res.ok) {
        setShowItemModal(false);
        fetchData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordMovement = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    setSubmitting(true);

    try {
      // Determine positive or negative delta
      let delta = Number(movementQty);
      if (['PRODUCTION_USAGE', 'ADJUSTMENT_OUT'].includes(movementType)) {
        delta = -Math.abs(delta);
      } else {
        delta = Math.abs(delta);
      }

      const res = await fetch('/api/inventory/movement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stock_item_id: selectedItem.id,
          type: movementType,
          quantity_change: delta,
          notes: movementNotes,
          created_by: user.name,
          record_expense: movementType === 'PURCHASE' ? recordExpense : false,
          supplier_name: supplierName,
        }),
      });

      if (res.ok) {
        setShowMovementModal(false);
        fetchData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const openMovementDialog = (item, defaultType = 'PURCHASE') => {
    setSelectedItem(item);
    setMovementType(defaultType);
    setMovementQty(10);
    setMovementNotes('');
    setRecordExpense(true);
    setShowMovementModal(true);
  };

  const lowStockCount = items.filter((it) => it.is_low_stock).length;

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
              Inventori, Bahan Baku & Mutasi Stok
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Pengelolaan ketersediaan kain, benang, kancing, dan catatan mutasi masuk/keluar
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowItemModal(true)}
            >
              <Plus size={16} />
              <span>Tambah Bahan / Item</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
          <button
            className={`btn btn-sm ${activeTab === 'stock' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('stock')}
          >
            <Boxes size={15} />
            <span>Katalog Stok Bahan ({items.length})</span>
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'movements' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('movements')}
          >
            <History size={15} />
            <span>Log Mutasi Stok ({movements.length})</span>
          </button>
        </div>

        {/* TAB 1: STOCK ITEMS */}
        {activeTab === 'stock' && (
          <>
            {/* Desktop Table View */}
            <div className="desktop-only-table">
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Nama Barang / Material</th>
                      <th>Kategori</th>
                      <th className="text-right">Sisa Stok</th>
                      <th className="text-right">Batas Min.</th>
                      <th>Lokasi Rak</th>
                      <th className="text-right">Estimasi Biaya / Satuan</th>
                      <th>Status Alert</th>
                      <th className="text-center" style={{ width: '180px' }}>
                        Mutasi Cepat
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it) => (
                      <tr key={it.id}>
                        <td>
                          <div style={{ fontWeight: 700 }}>{it.name}</div>
                          <div className="font-mono" style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {it.sku}
                          </div>
                        </td>
                        <td>
                          <span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>
                            {it.category}
                          </span>
                        </td>
                        <td className="text-right font-mono" style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                          {it.quantity} <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{it.unit}</span>
                        </td>
                        <td className="text-right font-mono" style={{ color: '#64748b' }}>
                          {it.min_stock} {it.unit}
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>{it.location || '-'}</td>
                        <td className="text-right font-mono">
                          Rp {Number(it.cost_per_unit || 0).toLocaleString('id-ID')}
                        </td>
                        <td>
                          {it.is_low_stock ? (
                            <span className="badge badge-REJECTED" style={{ animation: 'pulse 2s infinite' }}>
                              <AlertTriangle size={12} />
                              Stok Kritis
                            </span>
                          ) : (
                            <span className="badge badge-COMPLETED">
                              <CheckCircle size={12} />
                              Aman
                            </span>
                          )}
                        </td>
                        <td className="text-center">
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ color: '#059669', borderColor: '#a7f3d0' }}
                              title="Catat Pembelian / Stok Masuk"
                              onClick={() => openMovementDialog(it, 'PURCHASE')}
                            >
                              <ArrowDownRight size={14} />
                              <span>Masuk</span>
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ color: '#dc2626', borderColor: '#fecaca' }}
                              title="Catat Pemakaian Produksi / Keluar"
                              onClick={() => openMovementDialog(it, 'PRODUCTION_USAGE')}
                            >
                              <ArrowUpRight size={14} />
                              <span>Pakai</span>
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
              {items.map((it) => (
                <div key={it.id} className="mobile-data-card">
                  <div className="mobile-data-card-header">
                    <div>
                      <div className="mobile-data-card-code">{it.sku}</div>
                      <div className="mobile-data-card-title">{it.name}</div>
                      <div className="mobile-data-card-sub">Kategori: {it.category} | Rak: {it.location || '-'}</div>
                    </div>
                    {it.is_low_stock ? (
                      <span className="badge badge-REJECTED" style={{ animation: 'pulse 2s infinite' }}>
                        <AlertTriangle size={12} />
                        Kritis
                      </span>
                    ) : (
                      <span className="badge badge-COMPLETED">
                        <CheckCircle size={12} />
                        Aman
                      </span>
                    )}
                  </div>

                  <div className="mobile-data-card-grid">
                    <div className="mobile-data-card-field">
                      <span className="mobile-data-card-label">Sisa Stok Fisik</span>
                      <span className="mobile-data-card-val font-mono" style={{ fontSize: '1.15rem', color: it.is_low_stock ? '#dc2626' : '#0f172a' }}>
                        {it.quantity} <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{it.unit}</span>
                      </span>
                    </div>
                    <div className="mobile-data-card-field">
                      <span className="mobile-data-card-label">Batas Min. Aman</span>
                      <span className="mobile-data-card-val font-mono" style={{ color: '#64748b' }}>
                        {it.min_stock} {it.unit}
                      </span>
                    </div>
                    <div className="mobile-data-card-field" style={{ gridColumn: 'span 2' }}>
                      <span className="mobile-data-card-label">Estimasi Harga Satuan</span>
                      <span className="mobile-data-card-val font-mono">
                        Rp {Number(it.cost_per_unit || 0).toLocaleString('id-ID')} / {it.unit}
                      </span>
                    </div>
                  </div>

                  <div className="mobile-data-card-actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ color: '#059669', borderColor: '#a7f3d0' }}
                      onClick={() => openMovementDialog(it, 'PURCHASE')}
                    >
                      <ArrowDownRight size={14} />
                      <span>Catat Stok Masuk</span>
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ color: '#dc2626', borderColor: '#fecaca' }}
                      onClick={() => openMovementDialog(it, 'PRODUCTION_USAGE')}
                    >
                      <ArrowUpRight size={14} />
                      <span>Catat Pemakaian</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* TAB 2: STOCK MOVEMENTS LOG */}
        {activeTab === 'movements' && (
          <>
            {/* Desktop Table View */}
            <div className="desktop-only-table">
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Tanggal & Jam</th>
                      <th>Nama Barang</th>
                      <th>Tipe Mutasi</th>
                      <th className="text-right">Perubahan</th>
                      <th className="text-right">Stok Sebelum</th>
                      <th className="text-right">Stok Akhir</th>
                      <th>Keterangan / PIC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((m) => {
                      const isPositive = m.quantity_change > 0;
                      return (
                        <tr key={m.id}>
                          <td style={{ fontSize: '0.85rem' }}>
                            {new Date(m.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td style={{ fontWeight: 600 }}>{m.stock_item_name}</td>
                          <td>
                            <span
                              className="badge"
                              style={{
                                background: isPositive ? '#ecfdf5' : '#fef2f2',
                                color: isPositive ? '#065f46' : '#991b1b',
                              }}
                            >
                              {m.type}
                            </span>
                          </td>
                          <td
                            className="text-right font-mono"
                            style={{
                              fontWeight: 700,
                              color: isPositive ? '#059669' : '#dc2626',
                            }}
                          >
                            {isPositive ? `+${m.quantity_change}` : m.quantity_change}
                          </td>
                          <td className="text-right font-mono" style={{ color: '#64748b' }}>
                            {m.previous_quantity}
                          </td>
                          <td className="text-right font-mono" style={{ fontWeight: 800 }}>
                            {m.new_quantity}
                          </td>
                          <td>
                            <div style={{ fontSize: '0.85rem' }}>{m.notes || '-'}</div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                              Oleh: {m.created_by}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards View */}
            <div className="mobile-only-cards">
              {movements.map((m) => {
                const isPositive = m.quantity_change > 0;
                return (
                  <div key={m.id} className="mobile-data-card">
                    <div className="mobile-data-card-header">
                      <div>
                        <div className="mobile-data-card-title">{m.stock_item_name}</div>
                        <div className="mobile-data-card-sub">
                          {new Date(m.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                      <span
                        className="badge"
                        style={{
                          background: isPositive ? '#ecfdf5' : '#fef2f2',
                          color: isPositive ? '#065f46' : '#991b1b',
                        }}
                      >
                        {m.type}
                      </span>
                    </div>

                    <div className="mobile-data-card-grid">
                      <div className="mobile-data-card-field">
                        <span className="mobile-data-card-label">Perubahan Qty</span>
                        <span
                          className="mobile-data-card-val font-mono"
                          style={{
                            fontSize: '1.05rem',
                            color: isPositive ? '#059669' : '#dc2626',
                          }}
                        >
                          {isPositive ? `+${m.quantity_change}` : m.quantity_change}
                        </span>
                      </div>
                      <div className="mobile-data-card-field">
                        <span className="mobile-data-card-label">Alur Mutasi</span>
                        <span className="mobile-data-card-val font-mono" style={{ fontSize: '0.85rem' }}>
                          <span style={{ color: '#64748b' }}>{m.previous_quantity}</span> → <strong>{m.new_quantity}</strong>
                        </span>
                      </div>
                      <div className="mobile-data-card-field" style={{ gridColumn: 'span 2' }}>
                        <span className="mobile-data-card-label">Keterangan & PIC</span>
                        <span className="mobile-data-card-val" style={{ fontSize: '0.825rem', fontWeight: 500 }}>
                          {m.notes || '-'} <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>(Oleh: {m.created_by})</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Modal: Tambah Item Baru */}
      {showItemModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">Tambah Material / Bahan Baku Baru</div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowItemModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateItem}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nama Bahan</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Kain Katun Toyobo Fodu"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Kode SKU</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Contoh: FAB-TYB-004"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Kategori</label>
                    <select
                      className="form-select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="Bahan Baku">Bahan Baku (Kain)</option>
                      <option value="Aksesoris">Aksesoris (Kancing, Benang, Resleting)</option>
                      <option value="Packaging">Packaging (Plastik, Kardus)</option>
                      <option value="Barang Jadi">Barang Jadi</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Stok Awal</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input font-mono"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Satuan Unit</label>
                    <select
                      className="form-select"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                    >
                      <option value="meter">meter</option>
                      <option value="roll">roll</option>
                      <option value="pcs">pcs</option>
                      <option value="gross">gross</option>
                      <option value="cones">cones</option>
                      <option value="lusin">lusin</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Batas Minimum Alert</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input font-mono"
                      value={minStock}
                      onChange={(e) => setMinStock(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Biaya per Satuan (Rp)</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input font-mono"
                      value={costPerUnit}
                      onChange={(e) => setCostPerUnit(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Lokasi Penyimpanan Rak</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Rak Gudang B2"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowItemModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  Simpan Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Catat Mutasi Masuk/Keluar */}
      {showMovementModal && selectedItem && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">
                Catat Mutasi Stok: <span className="text-primary">{selectedItem.name}</span>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowMovementModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRecordMovement}>
              <div className="modal-body">
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Stok Saat Ini:</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                    {selectedItem.quantity} {selectedItem.unit}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Jenis Mutasi</label>
                  <select
                    className="form-select"
                    value={movementType}
                    onChange={(e) => setMovementType(e.target.value)}
                  >
                    <option value="PURCHASE">PURCHASE (Pembelian Stok Baru)</option>
                    <option value="PRODUCTION_USAGE">PRODUCTION_USAGE (Pemakaian Jahit/Produksi)</option>
                    <option value="ADJUSTMENT_IN">ADJUSTMENT_IN (Koreksi Tambah / Opname)</option>
                    <option value="ADJUSTMENT_OUT">ADJUSTMENT_OUT (Koreksi Kurang / Rusak)</option>
                    <option value="RETURN">RETURN (Pengembalian Bahan)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Jumlah ({selectedItem.unit})</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input font-mono"
                    value={movementQty}
                    onChange={(e) => setMovementQty(e.target.value)}
                    required
                  />
                </div>

                {movementType === 'PURCHASE' && (
                  <div
                    style={{
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      padding: '14px',
                      borderRadius: '10px',
                      marginBottom: '16px',
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, color: '#166534' }}>
                      <input
                        type="checkbox"
                        checked={recordExpense}
                        onChange={(e) => setRecordExpense(e.target.checked)}
                      />
                      <span>Otomatis catat pengeluaran bahan ke Laporan Keuangan</span>
                    </label>

                    {recordExpense && (
                      <div style={{ marginTop: '10px' }}>
                        <div style={{ fontSize: '0.85rem', color: '#15803d' }}>
                          Estimasi Biaya: Rp {(movementQty * (selectedItem.cost_per_unit || 0)).toLocaleString('id-ID')}
                        </div>
                        <input
                          type="text"
                          className="form-input"
                          style={{ marginTop: '6px' }}
                          placeholder="Nama Supplier / Toko"
                          value={supplierName}
                          onChange={(e) => setSupplierName(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Catatan Mutasi</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Pemotongan pola untuk order ORD-2026-002"
                    value={movementNotes}
                    onChange={(e) => setMovementNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowMovementModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  Simpan Mutasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
