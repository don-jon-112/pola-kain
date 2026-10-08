import React from 'react';
import { Printer, X, Truck, CheckCircle2, PackageCheck, AlertCircle } from 'lucide-react';

export default function DeliveryInvoiceModal({ delivery, onClose }) {
  if (!delivery) return null;

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
        {/* Modal Controls (Hidden when printing) */}
        <div className="modal-header no-print">
          <div>
            <div className="modal-title">
              Faktur Pengiriman & Surat Jalan: <span className="font-mono text-primary">{delivery.delivery_number}</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Dokumen pengiriman bertahap untuk PO Ref: <strong>{delivery.order_number}</strong>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
              <Printer size={15} />
              <span>Cetak Faktur / PDF</span>
            </button>
            <button className="btn btn-secondary btn-sm" onClick={onClose}>
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Invoice Paper */}
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
                  Jl. Industri Kreatif No. 18, Jakarta | Hotline: 0812-8899-0011
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  SURAT JALAN & FAKTUR PENGIRIMAN
                </div>
                <div className="font-mono" style={{ fontSize: '1rem', fontWeight: 800, color: '#4f46e5' }}>
                  {delivery.delivery_number}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '4px' }}>
                  No. PO / Order: <strong className="font-mono">{delivery.order_number}</strong>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Tanggal Kirim: {formatDate(delivery.delivery_date)}
                </div>
                <div style={{ marginTop: '6px' }}>
                  <span className={`badge badge-${delivery.status === 'DELIVERED' ? 'COMPLETED' : 'DELIVERING'}`}>
                    <span className="badge-dot"></span>
                    STATUS: {delivery.status === 'DELIVERED' ? 'DITERIMA DI LOKASI' : 'DALAM PENGIRIMAN'}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery & Recipient Meta */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Tujuan Pengiriman (Pemesan)
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                  {delivery.customer_name}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#334155', marginTop: '2px' }}>
                  Penerima: {delivery.recipient_name || delivery.customer_name}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                  Alamat: {delivery.address || '-'}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                  Telp / WA: {delivery.phone || '-'}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Logistik & Catatan Pengiriman
                </div>
                <div style={{ fontSize: '0.85rem', color: '#334155', marginTop: '4px' }}>
                  Metode: <strong>{delivery.delivery_method || 'Kurir Konveksi'}</strong>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#334155', marginTop: '2px' }}>
                  Driver / PIC: <strong>{delivery.pic_name || 'Driver'}</strong>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#475569', fontStyle: 'italic', marginTop: '6px' }}>
                  "{delivery.notes || 'Pengiriman barang tahap berjalan.'}"
                </div>
              </div>
            </div>

            {/* Shipped Items Breakdown Table (PARTIAL FULFILLMENT BREAKDOWN) */}
            <div className="table-responsive" style={{ marginBottom: '20px' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '36px' }}>No</th>
                    <th>Nama Produk & Varian</th>
                    <th className="text-center" style={{ width: '80px' }}>Total PO</th>
                    <th className="text-center" style={{ width: '90px' }}>Kirim Lalu</th>
                    <th className="text-center" style={{ width: '100px', background: '#e0e7ff', color: '#3730a3' }}>
                      Kirim Ini
                    </th>
                    <th className="text-center" style={{ width: '80px', background: '#fffbeb', color: '#92400e' }}>
                      Sisa PO
                    </th>
                    <th className="text-right" style={{ width: '110px' }}>Harga</th>
                    <th className="text-right" style={{ width: '130px' }}>Subtotal Ini</th>
                  </tr>
                </thead>
                <tbody>
                  {(delivery.items || []).map((it, idx) => (
                    <tr key={it.order_item_id || idx}>
                      <td className="text-center font-mono">{idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{it.product_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Ukuran: <strong>{it.size_name || it.size_code || 'N/A'}</strong>
                        </div>
                      </td>
                      <td className="text-center font-mono" style={{ color: '#64748b' }}>
                        {it.ordered_quantity} pcs
                      </td>
                      <td className="text-center font-mono" style={{ color: '#64748b' }}>
                        {it.previously_shipped} pcs
                      </td>
                      <td className="text-center font-mono" style={{ fontWeight: 800, color: '#4f46e5', background: '#f5f3ff' }}>
                        {it.quantity_shipped} pcs
                      </td>
                      <td className="text-center font-mono" style={{ fontWeight: 700, color: it.remaining_quantity > 0 ? '#d97706' : '#10b981', background: '#fffdf5' }}>
                        {it.remaining_quantity} pcs
                      </td>
                      <td className="text-right font-mono" style={{ fontSize: '0.85rem' }}>
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
                    <td colSpan="4" style={{ fontWeight: 700, textAlign: 'right', borderBottom: 'none' }}>
                      TOTAL DIKIRIM FAKTUR INI:
                    </td>
                    <td className="text-center font-mono" style={{ fontWeight: 800, fontSize: '1.05rem', color: '#4f46e5', borderBottom: 'none' }}>
                      {delivery.total_shipped_pcs} pcs
                    </td>
                    <td style={{ borderBottom: 'none' }}></td>
                    <td className="text-right" style={{ fontWeight: 700, borderBottom: 'none' }}>
                      Total Nilai Faktur:
                    </td>
                    <td className="text-right font-mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#4f46e5', borderBottom: 'none' }}>
                      Rp {Number(delivery.total_delivery_amount).toLocaleString('id-ID')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Backlog Alert Info if there is still remaining */}
            {(delivery.items || []).some((i) => i.remaining_quantity > 0) ? (
              <div
                style={{
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  color: '#92400e',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '28px',
                }}
              >
                <AlertCircle size={16} />
                <span>
                  <strong>Catatan Pengiriman Bertahap:</strong> Masih terdapat sisa pesanan pada PO ini yang belum dikirim. Sisa barang akan diterbitkan pada Surat Jalan / Faktur Pengiriman tahap berikutnya.
                </span>
              </div>
            ) : (
              <div
                style={{
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  color: '#065f46',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '28px',
                }}
              >
                <CheckCircle2 size={16} />
                <span>
                  <strong>Pengiriman Lengkap:</strong> Seluruh item pada PO ini telah selesai dan tuntas dikirim 100%.
                </span>
              </div>
            )}

            {/* Signature Area (3 Columns: Driver, Gudang, Penerima) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                marginTop: '32px',
                textAlign: 'center',
                fontSize: '0.8rem',
                color: '#475569',
                gap: '12px',
              }}
            >
              <div>
                <div>Pengirim (Driver / Ekspedisi),</div>
                <div style={{ height: '50px' }}></div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>({delivery.pic_name || 'Driver'})</div>
                <div style={{ fontSize: '0.7rem' }}>Petugas Pengantar</div>
              </div>

              <div>
                <div>Bagian Produksi / QC Gudang,</div>
                <div style={{ height: '50px' }}></div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>(Pak Hendra)</div>
                <div style={{ fontSize: '0.7rem' }}>Manajemen Konveksi</div>
              </div>

              <div>
                <div>Diterima Oleh (Pemesan),</div>
                <div style={{ height: '50px' }}></div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>({delivery.recipient_name || delivery.customer_name})</div>
                <div style={{ fontSize: '0.7rem' }}>Nama & Cap Lembaga</div>
              </div>
            </div>

            {/* Document note footer */}
            <div
              style={{
                marginTop: '28px',
                fontSize: '0.7rem',
                color: '#94a3b8',
                textAlign: 'center',
                borderTop: '1px solid #e2e8f0',
                paddingTop: '10px',
              }}
            >
              * Faktur Pengiriman & Surat Jalan ini adalah bukti serah terima resmi barang yang sah dari PolaKain Nusantara.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer no-print">
          <button className="btn btn-secondary" onClick={onClose}>
            Tutup
          </button>
          <button className="btn btn-primary" onClick={() => window.print()}>
            <Printer size={16} />
            <span>Cetak Dokumen Faktur</span>
          </button>
        </div>
      </div>
    </div>
  );
}
