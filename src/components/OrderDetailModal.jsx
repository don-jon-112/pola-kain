import React, { useState } from 'react';
import { X, Clock, CheckCircle2, AlertCircle, Printer, Truck, FileText, ArrowRight, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const getHumanStatusLabel = (status) => {
  switch (status) {
    case 'REQUESTED':
    case 'CONFIRMED':
      return 'Terkonfirmasi';
    case 'PRODUCTION':
      return 'Dalam Produksi';
    case 'READY':
      return 'Siap Kirim';
    case 'DELIVERING':
      return 'Dalam Pengiriman';
    case 'PARTIALLY_DELIVERED':
      return 'Terkirim Sebagian';
    case 'COMPLETED':
      return 'Selesai';
    case 'CANCELLED':
    case 'REJECTED':
      return 'Dibatalkan';
    default:
      return status || '-';
  }
};

export default function OrderDetailModal({
  order,
  onClose,
  onStatusUpdate,
  onViewReceipt,
  onOpenPartialShipment,
  onViewDeliveryInvoice,
}) {
  const { user } = useAuth();

  if (!order) return null;

  const isOwnerOrAdmin = user?.role === 'OWNER' || user?.role === 'SUPER_ADMIN';

  const formatDateTime = (iso) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const hasRemainingItems = (order.total_remaining_pcs !== undefined ? order.total_remaining_pcs : 1) > 0;

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-lg">
        <div className="modal-header">
          <div>
            <div className="modal-title">
              Detail PO: <span className="font-mono text-primary">{order.order_number}</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
              Dibuat pada {formatDateTime(order.created_at)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {isOwnerOrAdmin && hasRemainingItems && onOpenPartialShipment && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => onOpenPartialShipment(order)}
                title="Kirim barang bertahap untuk PO ini"
              >
                <Send size={14} />
                <span>Kirim Bertahap</span>
              </button>
            )}
            <button className="btn btn-secondary btn-sm" onClick={() => onViewReceipt(order)}>
              <Printer size={15} />
              <span>Bukti PO</span>
            </button>
            <button className="btn btn-secondary btn-sm" onClick={onClose}>
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="modal-body">
          {/* Status & Progress Pipeline */}
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>
                STATUS PROGRES PESANAN
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {order.is_partially_delivered && (
                  <span className="badge" style={{ background: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe' }}>
                    🚚 Terkirim Sebagian ({order.total_shipped_pcs} / {order.total_ordered_pcs} pcs)
                  </span>
                )}
                <span className={`badge badge-${order.status}`}>
                  <span className="badge-dot"></span>
                  {getHumanStatusLabel(order.status)}
                </span>
              </div>
            </div>

            {/* Pipeline progress bar: 3 Milestones */}
            {!['CANCELLED', 'REJECTED'].includes(order.status) && (
              <div className="pipeline-steps">
                {[
                  { key: 'CONFIRMED', label: '1. Terkonfirmasi' },
                  { key: 'PARTIALLY_DELIVERED', label: '2. Terkirim Sebagian' },
                  { key: 'COMPLETED', label: '3. Selesai' },
                ].map((step, idx) => {
                  let isPassed = false;
                  let isActive = false;

                  if (order.status === 'COMPLETED') {
                    isPassed = idx < 2;
                    isActive = idx === 2;
                  } else if (order.status === 'PARTIALLY_DELIVERED' || order.is_partially_delivered) {
                    isPassed = idx === 0;
                    isActive = idx === 1;
                  } else {
                    isActive = idx === 0;
                  }

                  return (
                    <React.Fragment key={step.key}>
                      <div className={`pipeline-step ${isActive ? 'active' : isPassed ? 'passed' : ''}`}>
                        {step.label}
                      </div>
                      {idx < 2 && <ArrowRight size={14} className="pipeline-arrow" />}
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </div>

          {/* Customer & Info Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Informasi Customer
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '4px' }}>
                {order.customer_name}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '2px' }}>
                Telp: {order.customer_phone || '-'}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                Alamat: {order.customer_address || '-'}
              </div>
            </div>

            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Catatan dari Pemesan
              </div>
              <div style={{ fontSize: '0.875rem', color: '#334155', fontStyle: 'italic', marginTop: '4px' }}>
                "{order.customer_message || 'Tidak ada catatan khusus.'}"
              </div>
              <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #e2e8f0', fontSize: '0.8rem' }}>
                Total Barang: <strong>{order.total_ordered_pcs || 0} pcs</strong> | Sisa Belum Kirim: <strong style={{ color: '#d97706' }}>{order.total_remaining_pcs !== undefined ? order.total_remaining_pcs : 0} pcs</strong>
              </div>
            </div>
          </div>

          {/* Itemized Order Snapshot with Partial Shipment Balances */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px' }}>
              Rincian Barang & Progres Pengiriman Bertahap:
            </div>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Barang & Kode</th>
                    <th>Ukuran</th>
                    <th className="text-center" style={{ width: '80px' }}>Total PO</th>
                    <th className="text-center" style={{ width: '90px', color: '#10b981' }}>Terkirim</th>
                    <th className="text-center" style={{ width: '80px', color: '#d97706' }}>Sisa</th>
                    <th className="text-right">Harga Satuan</th>
                    <th className="text-right">Total PO</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items || []).map((it) => {
                    const shipped = it.shipped_quantity || 0;
                    const remaining = it.remaining_quantity !== undefined ? it.remaining_quantity : Math.max(0, it.quantity - shipped);

                    return (
                      <tr key={it.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{it.product_name}</div>
                          <div className="font-mono" style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {it.product_code}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600 }}>{it.size_name || it.size_code || 'N/A'}</span>
                        </td>
                        <td className="text-center font-mono" style={{ fontWeight: 700 }}>
                          {it.quantity} pcs
                        </td>
                        <td className="text-center font-mono" style={{ fontWeight: 700, color: '#10b981' }}>
                          {shipped} pcs
                        </td>
                        <td className="text-center font-mono" style={{ fontWeight: 800, color: remaining > 0 ? '#d97706' : '#64748b' }}>
                          {remaining} pcs
                        </td>
                        <td className="text-right font-mono">
                          Rp {Number(it.unit_price).toLocaleString('id-ID')}
                        </td>
                        <td className="text-right font-mono" style={{ fontWeight: 700 }}>
                          Rp {Number(it.total_price).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="2" style={{ fontWeight: 700 }}>Total Seluruh PO:</td>
                    <td className="text-center font-mono" style={{ fontWeight: 800 }}>
                      {order.total_ordered_pcs || 0} pcs
                    </td>
                    <td className="text-center font-mono" style={{ fontWeight: 800, color: '#10b981' }}>
                      {order.total_shipped_pcs || 0} pcs
                    </td>
                    <td className="text-center font-mono" style={{ fontWeight: 800, color: '#d97706' }}>
                      {order.total_remaining_pcs !== undefined ? order.total_remaining_pcs : 0} pcs
                    </td>
                    <td></td>
                    <td className="text-right font-mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#4f46e5' }}>
                      Rp {Number(order.total_amount).toLocaleString('id-ID')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Delivery Invoices List (Faktur Tiap Pengiriman) */}
          {(order.deliveries || []).length > 0 && (
            <div style={{ marginBottom: '24px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck size={18} color="#4f46e5" />
                <span>Daftar Faktur & Surat Jalan Pengiriman untuk PO Ini:</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(order.deliveries || []).map((dlv) => (
                  <div
                    key={dlv.id}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <div>
                      <div className="font-mono" style={{ fontWeight: 800, color: '#4f46e5', fontSize: '0.9rem' }}>
                        {dlv.delivery_number}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Tgl: {dlv.delivery_date} | {dlv.delivery_method} (PIC: {dlv.pic_name})
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div className="font-mono" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                          {dlv.total_shipped_pcs} pcs
                        </div>
                        <div className="font-mono" style={{ fontSize: '0.75rem', color: '#4f46e5', fontWeight: 700 }}>
                          Rp {Number(dlv.total_delivery_amount || 0).toLocaleString('id-ID')}
                        </div>
                      </div>

                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '5px 10px' }}
                        onClick={() => onViewDeliveryInvoice && onViewDeliveryInvoice(dlv)}
                      >
                        <FileText size={14} />
                        <span>Buka Faktur</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Timeline History */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px' }}>
              Riwayat Perubahan Status & Audit Pengiriman:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(order.histories || []).map((h, i) => (
                <div
                  key={h.id || i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '10px 14px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    borderLeft: '3px solid #4f46e5',
                  }}
                >
                  <Clock size={16} color="#6366f1" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={`badge badge-${h.status}`} style={{ fontSize: '0.7rem' }}>
                        {getHumanStatusLabel(h.status)}
                      </span>
                      <span className="font-mono" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {formatDateTime(h.created_at)}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#334155', marginTop: '4px' }}>
                      {h.notes || 'Status diperbarui.'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                      Oleh: <strong>{h.updated_by_name || 'System'}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
