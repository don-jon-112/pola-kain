import React from 'react';
import { Printer, X, CheckCircle, Clock } from 'lucide-react';

export default function ReceiptModal({ order, onClose }) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="modal-overlay modal-overlay-top">
      <div className="modal-content modal-lg">
        <div className="modal-header order-detail-header-responsive no-print">
          <div className="order-detail-header-main">
            <div className="order-detail-title-wrapper">
              <div className="modal-title order-detail-title-text">Bukti Pemesanan (Order Receipt)</div>
              <div className="order-detail-date-text font-mono text-primary">{order.order_number}</div>
            </div>
            <button className="btn btn-secondary btn-sm order-detail-close-btn" onClick={onClose} aria-label="Tutup">
              <X size={16} />
            </button>
          </div>
          <div className="order-detail-header-buttons">
            <button className="btn btn-primary btn-sm order-detail-btn-action" onClick={handlePrint}>
              <Printer size={15} />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button className="btn btn-secondary btn-sm order-detail-desktop-close" onClick={onClose} aria-label="Tutup">
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="modal-body">
          <div className="receipt-paper">
            {/* Header */}
            <div className="receipt-header">
              <div>
                <div className="receipt-logo">POLAKAIN NUSANTARA</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                  Spesialis Seragam Sekolah, Batik, & Kaos Olahraga
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Jl. Industri Kreatif No. 18, Jakarta | Telp/WA: 0812-8899-0011
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  BUKTI PEMESANAN
                </div>
                <div className="font-mono" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#4f46e5' }}>
                  {order.order_number}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                  Tanggal: {formatDate(order.created_at)}
                </div>
                <div style={{ marginTop: '6px' }}>
                  <span className={`badge badge-${order.status}`}>
                    <span className="badge-dot"></span>
                    STATUS: {order.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Pemesan / Lembaga
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '4px' }}>
                  {order.customer_name}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                  {order.customer_phone || '-'}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                  {order.customer_address || '-'}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Catatan / Instruksi Khusus
                </div>
                <div style={{ fontSize: '0.875rem', color: '#334155', fontStyle: 'italic', marginTop: '4px' }}>
                  "{order.customer_message || 'Tidak ada pesan khusus'}"
                </div>
              </div>
            </div>

            {/* Desktop Table View (Snapshot Data - Formal Paper / Print) */}
            <div className="desktop-receipt-table">
              <table className="table" style={{ marginBottom: '20px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>No</th>
                    <th>Produk & Deskripsi</th>
                    <th style={{ width: '130px' }}>Ukuran (Size)</th>
                    <th className="text-right" style={{ width: '80px' }}>Qty</th>
                    <th className="text-right" style={{ width: '130px' }}>Harga Satuan</th>
                    <th className="text-right" style={{ width: '150px' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items || []).map((it, idx) => (
                    <tr key={it.id || idx}>
                      <td className="text-center font-mono">{idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{it.product_name}</div>
                        <div className="font-mono" style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Kode: {it.product_code || '-'}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: it.size_code ? '#1e293b' : '#94a3b8' }}>
                          {it.size_name || (it.size_code ? `Size ${it.size_code}` : 'N/A')}
                        </span>
                      </td>
                      <td className="text-right font-mono" style={{ fontWeight: 600 }}>
                        {it.quantity}
                      </td>
                      <td className="text-right font-mono">
                        Rp {Number(it.unit_price).toLocaleString('id-ID')}
                      </td>
                      <td className="text-right font-mono" style={{ fontWeight: 700 }}>
                        Rp {Number(it.total_price).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" style={{ borderBottom: 'none' }}></td>
                    <td className="text-right font-mono" style={{ fontWeight: 800, borderBottom: 'none' }}>
                      {(order.items || []).reduce((acc, curr) => acc + curr.quantity, 0)} pcs
                    </td>
                    <td className="text-right" style={{ fontWeight: 700, borderBottom: 'none' }}>
                      Total Pembayaran:
                    </td>
                    <td
                      className="text-right font-mono"
                      style={{ fontSize: '1.15rem', fontWeight: 800, color: '#4f46e5', borderBottom: 'none' }}
                    >
                      Rp {Number(order.total_amount).toLocaleString('id-ID')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile View: Clean Card Layout (Zero Horizontal Scroll) */}
            <div className="mobile-receipt-items">
              {(order.items || []).map((it, idx) => (
                <div key={it.id || idx} className="mobile-receipt-item-card">
                  <div className="mobile-receipt-item-top">
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', minWidth: 0 }}>
                      <span className="mobile-receipt-item-num">#{idx + 1}</span>
                      <div style={{ minWidth: 0 }}>
                        <div className="mobile-receipt-item-name">{it.product_name}</div>
                        <div className="mobile-receipt-item-code font-mono">
                          Kode: {it.product_code || '-'}
                        </div>
                      </div>
                    </div>
                    <span className="mobile-receipt-item-size-badge">
                      {it.size_name || (it.size_code ? `Size ${it.size_code}` : 'All Size')}
                    </span>
                  </div>

                  <div className="mobile-receipt-item-bottom">
                    <div className="mobile-receipt-calc">
                      <span className="mobile-receipt-qty">{it.quantity} pcs</span>
                      <span>×</span>
                      <span className="font-mono">Rp {Number(it.unit_price).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="mobile-receipt-subtotal font-mono">
                      Rp {Number(it.total_price).toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
              ))}

              {/* Mobile Summary Card */}
              <div className="mobile-receipt-summary-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Total Kuantitas:</span>
                  <span className="font-mono" style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                    {(order.items || []).reduce((acc, curr) => acc + curr.quantity, 0)} pcs
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px dashed #cbd5e1' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>Total Pembayaran:</span>
                  <span className="font-mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#4f46e5' }}>
                    Rp {Number(order.total_amount).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            {/* Signature Area */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                marginTop: '40px',
                textAlign: 'center',
                fontSize: '0.85rem',
                color: '#475569',
              }}
            >
              <div>
                <div>Dipesan Oleh,</div>
                <div style={{ height: '55px' }}></div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>({order.customer_name})</div>
                <div style={{ fontSize: '0.75rem' }}>Customer / Pemesan</div>
              </div>
              <div>
                <div>Dikonfirmasi Oleh,</div>
                <div style={{ height: '55px' }}></div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>Pak Hendra</div>
                <div style={{ fontSize: '0.75rem' }}>Management PolaKain</div>
              </div>
            </div>

            <div
              style={{
                marginTop: '32px',
                fontSize: '0.75rem',
                color: '#94a3b8',
                textAlign: 'center',
                borderTop: '1px solid #e2e8f0',
                paddingTop: '12px',
              }}
            >
              * Dokumen ini sah dan diterbitkan secara digital oleh Sistem Manajemen PolaKain.
            </div>
          </div>
        </div>

        <div className="modal-footer no-print">
          <button className="btn btn-secondary" onClick={onClose}>
            Tutup
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} />
            <span>Cetak Dokumen</span>
          </button>
        </div>
      </div>
    </div>
  );
}
