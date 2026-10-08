import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Calendar,
  Layers,
  PieChart,
  X,
  CreditCard,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function FinanceView() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // New Expense form
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Bahan Baku');
  const [amount, setAmount] = useState('');
  const [vendor, setVendor] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, expRes] = await Promise.all([
        fetch('/api/finance/summary'),
        fetch('/api/expenses'),
      ]);
      const [sumData, expData] = await Promise.all([sumRes.json(), expRes.json()]);
      setSummary(sumData);
      setExpenses(expData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          amount: Number(amount),
          vendor_or_payee: vendor,
          date,
          notes,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setTitle('');
        setAmount('');
        setVendor('');
        setNotes('');
        fetchData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Yakin ingin menghapus catatan pengeluaran ini?')) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Memuat laporan keuangan...</div>;
  }

  const isProfitPositive = (summary?.estimatedProfit || 0) >= 0;

  return (
    <div className="content-body">
      {/* Financial Overview Cards */}
      <div className="stats-grid">
        <div className="stat-card" style={{ '--stat-accent': '#10b981', '--stat-bg': '#ecfdf5' }}>
          <div>
            <div className="stat-label">Pendapatan Selesai (Revenue)</div>
            <div className="stat-value" style={{ color: '#065f46' }}>
              Rp {(summary?.totalRevenue || 0).toLocaleString('id-ID')}
            </div>
            <div className="stat-subtitle">Dari {summary?.completedOrderCount || 0} order yang telah tuntas</div>
          </div>
          <div className="stat-icon-wrapper">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="stat-card" style={{ '--stat-accent': '#ef4444', '--stat-bg': '#fef2f2' }}>
          <div>
            <div className="stat-label">Total Pengeluaran (Expense)</div>
            <div className="stat-value" style={{ color: '#991b1b' }}>
              Rp {(summary?.totalExpense || 0).toLocaleString('id-ID')}
            </div>
            <div className="stat-subtitle">Bahan, listrik, payroll, operasional</div>
          </div>
          <div className="stat-icon-wrapper">
            <TrendingDown size={24} />
          </div>
        </div>

        <div className="stat-card" style={{ '--stat-accent': isProfitPositive ? '#4f46e5' : '#dc2626', '--stat-bg': '#eef2ff' }}>
          <div>
            <div className="stat-label">Estimasi Profit (Laba Bersih)</div>
            <div className="stat-value" style={{ color: isProfitPositive ? '#4f46e5' : '#dc2626' }}>
              Rp {(summary?.estimatedProfit || 0).toLocaleString('id-ID')}
            </div>
            <div className="stat-subtitle">Revenue dikurangi seluruh pengeluaran</div>
          </div>
          <div className="stat-icon-wrapper">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="stat-card" style={{ '--stat-accent': '#0284c7', '--stat-bg': '#e0f2fe' }}>
          <div>
            <div className="stat-label">Potensi Pendapatan Antrean</div>
            <div className="stat-value" style={{ color: '#0369a1' }}>
              Rp {(summary?.pipelineRevenue || 0).toLocaleString('id-ID')}
            </div>
            <div className="stat-subtitle">Dari order yang sedang diproduksi</div>
          </div>
          <div className="stat-icon-wrapper">
            <CreditCard size={24} />
          </div>
        </div>
      </div>

      {/* Expense by Category Breakdown */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '14px' }}>
          Alokasi Pengeluaran per Kategori
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {Object.entries(summary?.expensesByCategory || {}).map(([cat, total]) => {
            const percentage = summary?.totalExpense > 0 ? Math.round((total / summary.totalExpense) * 100) : 0;
            return (
              <div
                key={cat}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>
                  <span>{cat}</span>
                  <span>{percentage}%</span>
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '4px', color: '#0f172a' }}>
                  Rp {total.toLocaleString('id-ID')}
                </div>
                <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '4px', marginTop: '8px', overflow: 'hidden' }}>
                  <div style={{ width: `${percentage}%`, height: '100%', background: '#4f46e5' }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="card">
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
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Catatan Pengeluaran Operasional</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Daftar seluruh pembelian bahan baku, utilitas workshop, dan gaji pekerja
            </p>
          </div>

          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            <Plus size={16} />
            <span>Catat Pengeluaran Baru</span>
          </button>
        </div>

        {/* Desktop Table View */}
        <div className="desktop-only-table">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Kategori</th>
                  <th>Uraian Pengeluaran</th>
                  <th>Penerima / Vendor</th>
                  <th className="text-right">Nominal Biaya</th>
                  <th>Catatan</th>
                  <th className="text-center" style={{ width: '60px' }}>
                    Hapus
                  </th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp.id}>
                    <td style={{ fontSize: '0.85rem' }}>{exp.date}</td>
                    <td>
                      <span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>
                        {exp.category}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{exp.title}</td>
                    <td style={{ fontSize: '0.85rem' }}>{exp.vendor_or_payee || '-'}</td>
                    <td className="text-right font-mono" style={{ fontWeight: 700, color: '#b91c1c' }}>
                      Rp {Number(exp.amount).toLocaleString('id-ID')}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{exp.notes || '-'}</td>
                    <td className="text-center">
                      <button
                        className="btn btn-secondary btn-sm btn-icon"
                        style={{ color: '#ef4444' }}
                        title="Hapus"
                        onClick={() => handleDeleteExpense(exp.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards View */}
        <div className="mobile-only-cards">
          {expenses.map((exp) => (
            <div key={exp.id} className="mobile-data-card">
              <div className="mobile-data-card-header">
                <div>
                  <div className="mobile-data-card-title">{exp.title}</div>
                  <div className="mobile-data-card-sub">Tanggal: {exp.date}</div>
                </div>
                <span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>
                  {exp.category}
                </span>
              </div>

              <div className="mobile-data-card-grid">
                <div className="mobile-data-card-field">
                  <span className="mobile-data-card-label">Nominal Pengeluaran</span>
                  <span className="mobile-data-card-val font-mono" style={{ color: '#b91c1c', fontSize: '1.05rem' }}>
                    Rp {Number(exp.amount).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="mobile-data-card-field">
                  <span className="mobile-data-card-label">Penerima / Vendor</span>
                  <span className="mobile-data-card-val" style={{ fontSize: '0.85rem' }}>
                    {exp.vendor_or_payee || '-'}
                  </span>
                </div>
                {exp.notes && (
                  <div className="mobile-data-card-field" style={{ gridColumn: 'span 2' }}>
                    <span className="mobile-data-card-label">Catatan Tambahan</span>
                    <span className="mobile-data-card-val" style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748b' }}>
                      {exp.notes}
                    </span>
                  </div>
                )}
              </div>

              <div className="mobile-data-card-actions">
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ color: '#ef4444', borderColor: '#fecaca' }}
                  onClick={() => handleDeleteExpense(exp.id)}
                >
                  <Trash2 size={14} />
                  <span>Hapus Pengeluaran</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Tambah Pengeluaran */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">Catat Pengeluaran Baru</div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateExpense}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Uraian / Judul Pengeluaran</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Beli kancing cadangan 5 gross"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Kategori</label>
                    <select
                      className="form-select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="Bahan Baku">Bahan Baku</option>
                      <option value="Listrik">Listrik & Utilitas</option>
                      <option value="Transport">Transport & Bensin</option>
                      <option value="Packaging">Packaging & Kardus</option>
                      <option value="Maintenance">Maintenance Mesin</option>
                      <option value="Operasional">Operasional Harian</option>
                      <option value="Payroll">Gaji / Payroll</option>
                      <option value="Lain-lain">Lain-lain</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Nominal (Rp)</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input font-mono"
                      placeholder="Contoh: 250000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Penerima / Vendor</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Contoh: Toko Berkat Tekstil"
                      value={vendor}
                      onChange={(e) => setVendor(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tanggal Transaksi</label>
                    <input
                      type="date"
                      className="form-input"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Catatan Tambahan</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Faktur #89192 bayar tunai"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  Simpan Pengeluaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
