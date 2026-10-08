import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, AlertCircle, ShoppingBag, Sparkles, Minus } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';

export default function CustomerOrderRequestView({ onOrderSubmitted, onCancel }) {
  const { user, customer } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [customerMessage, setCustomerMessage] = useState('');

  // Rows of order items
  const [rows, setRows] = useState([
    {
      id: 1,
      productId: '',
      sizeCode: '',
      quantity: 1,
      unitPrice: 0,
      subtotal: 0,
    },
  ]);

  useEffect(() => {
    fetch('/api/products?activeOnly=true')
      .then((r) => r.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const addRow = () => {
    setRows([
      ...rows,
      {
        id: Date.now(),
        productId: '',
        sizeCode: '',
        quantity: 1,
        unitPrice: 0,
        subtotal: 0,
      },
    ]);
  };

  const removeRow = (rowId) => {
    if (rows.length === 1) return;
    setRows(rows.filter((r) => r.id !== rowId));
  };

  const handleProductChange = (rowId, newProductId) => {
    const prod = products.find((p) => p.id === newProductId);
    setRows(
      rows.map((row) => {
        if (row.id !== rowId) return row;
        if (!prod) {
          return {
            ...row,
            productId: '',
            sizeCode: '',
            unitPrice: 0,
            subtotal: 0,
          };
        }

        const price = prod.price || 0;
        const initialSize = prod.has_size ? '' : null;
        return {
          ...row,
          productId: newProductId,
          sizeCode: initialSize,
          unitPrice: price,
          subtotal: price * row.quantity,
        };
      })
    );
  };

  const handleSizeChange = (rowId, newSizeCode) => {
    setRows(
      rows.map((row) => {
        if (row.id !== rowId) return row;
        const prod = products.find((p) => p.id === row.productId);
        let unitPrice = prod ? Number(prod.price) : 0;
        if (prod && prod.has_size && newSizeCode) {
          const sizeObj = (prod.sizes || []).find((s) => s.size_code === newSizeCode);
          if (sizeObj && sizeObj.price !== undefined && sizeObj.price !== null) {
            unitPrice = Number(sizeObj.price);
          }
        }
        return {
          ...row,
          sizeCode: newSizeCode,
          unitPrice,
          subtotal: unitPrice * row.quantity,
        };
      })
    );
  };

  const handleQuantityChange = (rowId, newQty) => {
    const qty = Math.max(1, parseInt(newQty, 10) || 1);
    setRows(
      rows.map((row) => {
        if (row.id !== rowId) return row;
        return {
          ...row,
          quantity: qty,
          subtotal: row.unitPrice * qty,
        };
      })
    );
  };

  const stepQuantity = (rowId, delta) => {
    const row = rows.find((r) => r.id === rowId);
    if (!row) return;
    const currentQty = row.quantity || 1;
    handleQuantityChange(rowId, Math.max(1, currentQty + delta));
  };

  // DUPLICATE VALIDATION HELPER (Section 14 & 45)
  const getDisabledSizesForRow = (currentRowId, productId) => {
    if (!productId) return new Set();
    const disabled = new Set();
    rows.forEach((r) => {
      if (r.id !== currentRowId && r.productId === productId && r.sizeCode) {
        disabled.add(String(r.sizeCode));
      }
    });
    return disabled;
  };

  const grandTotal = rows.reduce((sum, r) => sum + r.subtotal, 0);
  const totalPieces = rows.reduce((sum, r) => sum + (r.productId ? r.quantity : 0), 0);
  const hasIncompleteSizes = rows.some((r) => {
    if (!r.productId) return false;
    const prod = products.find((p) => p.id === r.productId);
    return Boolean(prod?.has_size && !r.sizeCode);
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const custId = user?.role === 'CUSTOMER' ? user.customer_id : 'cust_01';
    if (!custId) {
      setError('Customer profile tidak ditemukan. Pastikan akun terhubung dengan data customer.');
      return;
    }

    // Validate rows
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.productId) {
        setError(`Item #${i + 1}: Silakan pilih produk terlebih dahulu.`);
        return;
      }
      const prod = products.find((p) => p.id === r.productId);
      if (prod?.has_size && !r.sizeCode) {
        const msg = `Item #${i + 1} (${prod.name}): Ukuran (size) belum dipilih! Ukuran wajib diisi untuk memesan produk ini.`;
        setError(msg);
        alert(`⚠️ PERINGATAN: Item #${i + 1} (${prod.name}) belum dipilih ukurannya! Silakan pilih ukuran terlebih dahulu sebelum membuat pesanan.`);
        return;
      }
      if (r.quantity < 1) {
        setError(`Item #${i + 1}: Kuantitas minimal 1 pcs.`);
        return;
      }
    }

    // Duplicate validation
    const seen = new Set();
    for (const r of rows) {
      const key = `${r.productId}__${r.sizeCode || 'NONE'}`;
      if (seen.has(key)) {
        setError('Terdapat produk dan ukuran yang sama pada pesanan. Silakan gabungkan jumlahnya.');
        return;
      }
      seen.add(key);
    }

    setSubmitting(true);
    try {
      const payload = {
        customer_id: custId,
        customer_message: customerMessage,
        created_by: user.name,
        items: rows.map((r) => ({
          product_id: r.productId,
          size_code: r.sizeCode || null,
          quantity: r.quantity,
        })),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal membuat pesanan');
      }

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      if (onOrderSubmitted) {
        onOrderSubmitted(data.order);
      }
    } catch (err) {
      setError(err.message || 'Terjadi gangguan jaringan');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Memuat katalog produk...</div>;
  }

  return (
    <div className="content-body" style={{ maxWidth: '1000px' }}>
      <div className="card">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', gap: '10px' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Formulir Pemesanan Seragam</h2>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
              Aturan: Ukuran yang sudah dipilih pada produk yang sama otomatis dinonaktifkan di baris berikutnya.
            </p>
          </div>
          <span className="badge badge-CONFIRMED">
            {customer?.name || user?.name || 'Customer'}
          </span>
        </div>

        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              padding: '12px 14px',
              borderRadius: '10px',
              fontSize: '0.85rem',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* DESKTOP TABLE VIEW */}
          <div className="table-responsive desktop-order-table" style={{ marginBottom: '16px' }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '36px' }}>No</th>
                  <th style={{ minWidth: '240px' }}>Produk</th>
                  <th style={{ minWidth: '170px' }}>Ukuran</th>
                  <th style={{ width: '100px' }} className="text-right">Qty</th>
                  <th style={{ width: '130px' }} className="text-right">Harga</th>
                  <th style={{ width: '140px' }} className="text-right">Subtotal</th>
                  <th style={{ width: '44px' }} className="text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const selectedProd = products.find((p) => p.id === row.productId);
                  const disabledSizes = getDisabledSizesForRow(row.id, row.productId);

                  return (
                    <tr key={row.id}>
                      <td className="text-center font-mono">{idx + 1}</td>
                      <td>
                        <select
                          className="form-select"
                          value={row.productId}
                          onChange={(e) => handleProductChange(row.id, e.target.value)}
                          required
                        >
                          <option value="">-- Pilih Produk --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} - Rp {p.price.toLocaleString('id-ID')}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td>
                        {selectedProd?.has_size ? (
                          <div>
                            <select
                              className="form-select"
                              style={{
                                borderColor: !row.sizeCode ? '#ef4444' : undefined,
                                backgroundColor: !row.sizeCode ? '#fff5f5' : undefined,
                              }}
                              value={row.sizeCode || ''}
                              onChange={(e) => handleSizeChange(row.id, e.target.value)}
                              required
                            >
                              <option value="">-- Pilih Ukuran --</option>
                              {(selectedProd.sizes || []).map((sz) => {
                                const isDisabled = disabledSizes.has(String(sz.size_code));
                                const szPrice = sz.price !== undefined ? sz.price : selectedProd.price;
                                return (
                                  <option
                                    key={sz.id}
                                    value={sz.size_code}
                                    disabled={isDisabled}
                                  >
                                    {sz.size_name || `Size ${sz.size_code}`} - Rp {Number(szPrice).toLocaleString('id-ID')}
                                    {isDisabled ? ' (Sudah dipilih)' : ''}
                                  </option>
                                );
                              })}
                            </select>
                            {!row.sizeCode && (
                              <div style={{ color: '#ef4444', fontSize: '0.725rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                                <AlertCircle size={12} />
                                <span>Wajib pilih ukuran</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div
                            style={{
                              padding: '8px',
                              background: '#f1f5f9',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              color: '#94a3b8',
                              textAlign: 'center',
                            }}
                          >
                            N/A (Tanpa Size)
                          </div>
                        )}
                      </td>

                      <td>
                        <input
                          type="number"
                          min="1"
                          className="form-input text-right font-mono"
                          value={row.quantity}
                          onChange={(e) => handleQuantityChange(row.id, e.target.value)}
                          disabled={!row.productId}
                          required
                        />
                      </td>

                      <td className="text-right font-mono" style={{ color: '#475569' }}>
                        Rp {row.unitPrice.toLocaleString('id-ID')}
                      </td>

                      <td className="text-right font-mono" style={{ fontWeight: 700 }}>
                        Rp {row.subtotal.toLocaleString('id-ID')}
                      </td>

                      <td className="text-center">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm btn-icon"
                          style={{ color: '#ef4444' }}
                          onClick={() => removeRow(row.id)}
                          disabled={rows.length === 1}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARD VIEW (Optimized for Smartphone Screens) */}
          <div className="mobile-order-cards-container" style={{ marginBottom: '16px' }}>
            {rows.map((row, idx) => {
              const selectedProd = products.find((p) => p.id === row.productId);
              const disabledSizes = getDisabledSizesForRow(row.id, row.productId);

              return (
                <div key={row.id} className="mobile-order-card">
                  <div className="mobile-order-card-header">
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4f46e5' }}>
                      Item #{idx + 1}
                    </span>
                    {rows.length > 1 && (
                      <button
                        type="button"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                        onClick={() => removeRow(row.id)}
                      >
                        <Trash2 size={15} />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>

                  {/* Product Field */}
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Produk Seragam</label>
                    <select
                      className="form-select"
                      value={row.productId}
                      onChange={(e) => handleProductChange(row.id, e.target.value)}
                      required
                    >
                      <option value="">-- Pilih Produk --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Rp {p.price.toLocaleString('id-ID')})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Size Field */}
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 0 }}>Ukuran (Size)</label>
                      {selectedProd?.has_size && !row.sizeCode && (
                        <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 700 }}>
                          *Wajib dipilih
                        </span>
                      )}
                    </div>
                    {selectedProd?.has_size ? (
                      <div>
                        <select
                          className="form-select"
                          style={{
                            borderColor: !row.sizeCode ? '#ef4444' : undefined,
                            backgroundColor: !row.sizeCode ? '#fff5f5' : undefined,
                          }}
                          value={row.sizeCode || ''}
                          onChange={(e) => handleSizeChange(row.id, e.target.value)}
                          required
                        >
                          <option value="">-- Pilih Ukuran --</option>
                          {(selectedProd.sizes || []).map((sz) => {
                            const isDisabled = disabledSizes.has(String(sz.size_code));
                            const szPrice = sz.price !== undefined ? sz.price : selectedProd.price;
                            return (
                              <option
                                key={sz.id}
                                value={sz.size_code}
                                disabled={isDisabled}
                              >
                                {sz.size_name || `Size ${sz.size_code}`} - Rp {Number(szPrice).toLocaleString('id-ID')}
                                {isDisabled ? ' (Sudah dipilih)' : ''}
                              </option>
                            );
                          })}
                        </select>
                        {!row.sizeCode && (
                          <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                            <AlertCircle size={13} />
                            <span>Silakan pilih ukuran terlebih dahulu</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: '10px',
                          background: '#f8fafc',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          color: '#94a3b8',
                        }}
                      >
                        N/A (Produk ini tidak memiliki variasi ukuran)
                      </div>
                    )}
                  </div>

                  {/* Quantity Stepper & Price Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '10px', borderTop: '1px dashed #e2e8f0' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>JUMLAH (PCS)</div>
                      <div className="mobile-qty-stepper" style={{ marginTop: '4px' }}>
                        <button
                          type="button"
                          className="stepper-btn"
                          onClick={() => stepQuantity(row.id, -1)}
                          disabled={!row.productId || row.quantity <= 1}
                        >
                          <Minus size={14} />
                        </button>
                        <input
                          type="number"
                          min="1"
                          className="stepper-input font-mono"
                          value={row.quantity}
                          onChange={(e) => handleQuantityChange(row.id, e.target.value)}
                          disabled={!row.productId}
                        />
                        <button
                          type="button"
                          className="stepper-btn"
                          onClick={() => stepQuantity(row.id, 1)}
                          disabled={!row.productId}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>SUBTOTAL</div>
                      <div className="font-mono" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                        Rp {row.subtotal.toLocaleString('id-ID')}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                        @ Rp {row.unitPrice.toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Row Button */}
          <div style={{ marginBottom: '20px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', padding: '10px' }}
              onClick={addRow}
            >
              <Plus size={16} />
              <span>Tambah Varian Produk Lain</span>
            </button>
          </div>

          {/* Customer Message & Summary Box */}
          <div
            className="grid-mobile-stack"
            style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 0.8fr',
              gap: '16px',
              background: '#f8fafc',
              padding: '16px',
              borderRadius: '12px',
              marginBottom: '20px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div>
              <label className="form-label">Catatan Pemesan / Deadline:</label>
              <textarea
                className="form-textarea"
                rows="3"
                placeholder="Contoh: Harap selesai sebelum 25 November 2026. Dipisah per kelas."
                value={customerMessage}
                onChange={(e) => setCustomerMessage(e.target.value)}
              ></textarea>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: '#ffffff',
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>
                  RINGKASAN
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.85rem' }}>
                  <span style={{ color: '#475569' }}>Total Pcs:</span>
                  <span className="font-mono" style={{ fontWeight: 700 }}>{totalPieces} pcs</span>
                </div>
              </div>

              <div style={{ borderTop: '2px dashed #cbd5e1', paddingTop: '10px', marginTop: '10px' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>TOTAL PEMBAYARAN:</div>
                <div
                  className="font-mono"
                  style={{ fontSize: '1.35rem', fontWeight: 800, color: '#4f46e5' }}
                >
                  Rp {grandTotal.toLocaleString('id-ID')}
                </div>
              </div>
            </div>
          </div>

          {/* Incomplete size warning banner */}
          {hasIncompleteSizes && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#991b1b',
                fontSize: '0.85rem',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <div>
                <strong>Ukuran belum lengkap!</strong> Ada produk yang belum dipilih variasi ukurannya. Silakan pilih ukuran pada produk bertanda merah di atas agar pesanan dapat dikirim.
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            {onCancel && (
              <button type="button" className="btn btn-secondary" onClick={onCancel} style={{ flex: '1' }}>
                Batal
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: '2', padding: '12px', opacity: hasIncompleteSizes ? 0.7 : 1 }}
              disabled={submitting || grandTotal === 0}
            >
              <Sparkles size={16} />
              <span>{submitting ? 'Mengirim...' : 'Kirim Pesanan (PO)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
