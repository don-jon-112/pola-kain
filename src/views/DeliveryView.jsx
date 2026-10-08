import React, { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Search,
  RotateCcw,
} from 'lucide-react';

export default function DeliveryView({ onViewDeliveryInvoice }) {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/deliveries');
      const data = await res.json();
      setDeliveries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const handleMarkDelivered = async (deliveryId) => {
    if (!window.confirm('Tandai faktur pengiriman ini telah sampai & DITERIMA oleh customer?')) return;
    try {
      const res = await fetch(`/api/deliveries/${deliveryId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'DELIVERED',
          notes: 'Barang diterima lengkap oleh customer.',
        }),
      });
      if (res.ok) {
        fetchDeliveries();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredDeliveries = deliveries.filter((dlv) => {
    const q = searchQuery.toLowerCase();
    const matchNum = (dlv.delivery_number || '').toLowerCase().includes(q);
    const matchPO = (dlv.order_number || '').toLowerCase().includes(q);
    const matchCust = (dlv.customer_name || '').toLowerCase().includes(q);
    return matchNum || matchPO || matchCust;
  });

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
              Faktur Pengiriman & Surat Jalan
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Arsip dan cetak seluruh faktur pengiriman bertahap (Surat Jalan) yang diterbitkan dari menu Pesanan.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary btn-sm" onClick={fetchDeliveries} title="Muat ulang data">
              <RotateCcw size={15} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: '18px', maxWidth: '350px', position: 'relative' }}>
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '36px', height: '38px', fontSize: '0.85rem' }}
            placeholder="Cari No. Faktur, No. PO, atau Customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search
            size={16}
            style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8' }}
          />
        </div>

        {/* Invoice List Content */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            Memuat arsip faktur pengiriman...
          </div>
        ) : filteredDeliveries.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
            Belum ada faktur pengiriman yang diterbitkan atau cocok dengan pencarian.
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="desktop-only-table">
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>No. Faktur / Surat Jalan</th>
                      <th>Ref. No PO</th>
                      <th>Customer / Lembaga</th>
                      <th>Tanggal Kirim</th>
                      <th className="text-center">Jml Barang Dikirim</th>
                      <th className="text-right">Nilai Faktur Ini</th>
                      <th>Status Pengantaran</th>
                      <th className="text-center" style={{ width: '170px' }}>
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDeliveries.map((dlv) => (
                      <tr key={dlv.id}>
                        <td className="font-mono" style={{ fontWeight: 800, color: '#4f46e5' }}>
                          {dlv.delivery_number || dlv.id}
                        </td>
                        <td className="font-mono" style={{ fontWeight: 600 }}>
                          {dlv.order_number}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700 }}>{dlv.customer_name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            PIC: {dlv.pic_name || dlv.delivery_method}
                          </div>
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>{dlv.delivery_date}</td>
                        <td className="text-center font-mono" style={{ fontWeight: 800, color: '#0f172a' }}>
                          {dlv.total_shipped_pcs || 0} pcs
                        </td>
                        <td className="text-right font-mono" style={{ fontWeight: 700, color: '#4f46e5' }}>
                          Rp {Number(dlv.total_delivery_amount || 0).toLocaleString('id-ID')}
                        </td>
                        <td>
                          <span className={`badge badge-${dlv.status === 'DELIVERED' ? 'COMPLETED' : 'DELIVERING'}`}>
                            <span className="badge-dot"></span>
                            {dlv.status === 'DELIVERED' ? 'Diterima di Lokasi' : 'Dalam Pengiriman'}
                          </span>
                        </td>
                        <td className="text-center">
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.75rem' }}
                              title="Lihat & Cetak Faktur Pengiriman"
                              onClick={() => onViewDeliveryInvoice && onViewDeliveryInvoice(dlv)}
                            >
                              <FileText size={14} />
                              <span>Faktur</span>
                            </button>
                            {dlv.status !== 'DELIVERED' && (
                              <button
                                className="btn btn-success btn-sm"
                                style={{ fontSize: '0.75rem', padding: '5px 8px' }}
                                title="Tandai Diterima di Lokasi"
                                onClick={() => handleMarkDelivered(dlv.id)}
                              >
                                <CheckCircle2 size={14} />
                              </button>
                            )}
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
              {filteredDeliveries.map((dlv) => (
                <div key={dlv.id} className="mobile-data-card">
                  <div className="mobile-data-card-header">
                    <div>
                      <div className="mobile-data-card-code">{dlv.delivery_number || dlv.id}</div>
                      <div className="mobile-data-card-title">{dlv.customer_name}</div>
                      <div className="mobile-data-card-sub">Ref PO: <span className="font-mono">{dlv.order_number}</span></div>
                    </div>
                    <span className={`badge badge-${dlv.status === 'DELIVERED' ? 'COMPLETED' : 'DELIVERING'}`}>
                      <span className="badge-dot"></span>
                      {dlv.status === 'DELIVERED' ? 'Diterima' : 'Dalam Pengiriman'}
                    </span>
                  </div>

                  <div className="mobile-data-card-grid">
                    <div className="mobile-data-card-field">
                      <span className="mobile-data-card-label">Tgl Pengiriman</span>
                      <span className="mobile-data-card-val" style={{ fontSize: '0.825rem' }}>{dlv.delivery_date}</span>
                    </div>
                    <div className="mobile-data-card-field">
                      <span className="mobile-data-card-label">Metode / Kurir</span>
                      <span className="mobile-data-card-val" style={{ fontSize: '0.825rem' }}>{dlv.delivery_method}</span>
                    </div>
                    <div className="mobile-data-card-field">
                      <span className="mobile-data-card-label">Jumlah Dikirim</span>
                      <span className="mobile-data-card-val font-mono" style={{ color: '#0f172a' }}>{dlv.total_shipped_pcs || 0} pcs</span>
                    </div>
                    <div className="mobile-data-card-field">
                      <span className="mobile-data-card-label">Nilai Faktur Ini</span>
                      <span className="mobile-data-card-val font-mono" style={{ color: '#4f46e5' }}>
                        Rp {Number(dlv.total_delivery_amount || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <div className="mobile-data-card-actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onViewDeliveryInvoice && onViewDeliveryInvoice(dlv)}
                    >
                      <FileText size={15} />
                      <span>Lihat & Cetak Faktur</span>
                    </button>
                    {dlv.status !== 'DELIVERED' && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleMarkDelivered(dlv.id)}
                      >
                        <CheckCircle2 size={15} />
                        <span>Tandai Diterima</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
