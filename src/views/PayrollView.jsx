import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  DollarSign,
  Printer,
  CheckCircle,
  FileText,
  Clock,
  X,
  Scissors,
  Trash2,
  Package,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PayrollView() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('payrolls'); // 'payrolls' or 'employees'

  // Modals
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [slipModal, setSlipModal] = useState(null);

  // New Employee Form
  const [empName, setEmpName] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empPosition, setEmpPosition] = useState('Penjahit Utama');
  const [empSalaryType, setEmpSalaryType] = useState('PIECE_RATE');
  const [empBaseRate, setEmpBaseRate] = useState(12000);

  // New Payroll Form
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [payrollSalaryType, setPayrollSalaryType] = useState('PIECE_RATE');
  const [period, setPeriod] = useState('Oktober 2026');
  const [baseSalary, setBaseSalary] = useState(0);
  const [productionItems, setProductionItems] = useState([]);
  const [overtime, setOvertime] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [deduction, setDeduction] = useState(0);
  const [payrollNotes, setPayrollNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [empRes, prlRes, prodRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/payrolls'),
        fetch('/api/products'),
      ]);
      const [empData, prlData, prodData] = await Promise.all([
        empRes.json(),
        prlRes.json(),
        prodRes.json(),
      ]);
      setEmployees(empData);
      setPayrolls(prlData);
      setProducts(prodData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: empName,
          phone: empPhone,
          position: empPosition,
          salary_type: empSalaryType,
          base_rate: Number(empBaseRate),
        }),
      });
      if (res.ok) {
        setShowEmployeeModal(false);
        setEmpName('');
        setEmpPhone('');
        fetchData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectEmployeeForPayroll = (empId, currentProducts = products) => {
    setSelectedEmpId(empId);
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      const type = emp.salary_type || 'PIECE_RATE';
      setPayrollSalaryType(type);
      if (type === 'PIECE_RATE') {
        const prodList = currentProducts.length > 0 ? currentProducts : products;
        const firstProd = prodList[0] || { id: '', name: '', wage_per_piece: 10000 };
        setProductionItems([
          {
            product_id: firstProd.id,
            product_name: firstProd.name,
            quantity: 0,
            wage_per_piece: Number(firstProd.wage_per_piece || 10000),
            subtotal: 0,
          },
        ]);
        setBaseSalary(0);
      } else {
        setBaseSalary(emp.base_rate || 3000000);
        setProductionItems([]);
      }
    }
  };

  const handleAddProductionRow = () => {
    const firstProd = products[0] || { id: '', name: '', wage_per_piece: 10000 };
    setProductionItems([
      ...productionItems,
      {
        product_id: firstProd.id,
        product_name: firstProd.name,
        quantity: 0,
        wage_per_piece: Number(firstProd.wage_per_piece || 10000),
        subtotal: 0,
      },
    ]);
  };

  const handleRemoveProductionRow = (index) => {
    if (productionItems.length === 1) {
      alert('Minimal harus ada 1 baris produk.');
      return;
    }
    setProductionItems(productionItems.filter((_, idx) => idx !== index));
  };

  const handleProductionItemChange = (index, field, value) => {
    const updated = [...productionItems];
    const item = { ...updated[index] };

    if (field === 'product_id') {
      const found = products.find((p) => p.id === value);
      item.product_id = value;
      item.product_name = found ? found.name : '';
      item.wage_per_piece = found ? Number(found.wage_per_piece || 0) : 0;
      item.subtotal = (Number(item.quantity) || 0) * (Number(item.wage_per_piece) || 0);
    } else if (field === 'quantity') {
      item.quantity = Number(value) || 0;
      item.subtotal = item.quantity * (Number(item.wage_per_piece) || 0);
    } else if (field === 'wage_per_piece') {
      item.wage_per_piece = Number(value) || 0;
      item.subtotal = (Number(item.quantity) || 0) * item.wage_per_piece;
    }

    updated[index] = item;
    setProductionItems(updated);
  };

  const pieceRateTotal =
    payrollSalaryType === 'PIECE_RATE'
      ? productionItems.reduce((acc, row) => acc + (Number(row.subtotal) || 0), 0)
      : Number(baseSalary || 0);

  const totalPiecesOutput =
    payrollSalaryType === 'PIECE_RATE'
      ? productionItems.reduce((acc, row) => acc + (Number(row.quantity) || 0), 0)
      : 0;

  const handleCreatePayroll = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const effectiveBaseSalary = payrollSalaryType === 'PIECE_RATE' ? pieceRateTotal : Number(baseSalary);
      const res = await fetch('/api/payrolls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: selectedEmpId,
          period,
          salary_type: payrollSalaryType,
          production_items: payrollSalaryType === 'PIECE_RATE' ? productionItems : [],
          total_pieces: totalPiecesOutput,
          base_salary: effectiveBaseSalary,
          overtime: Number(overtime),
          bonus: Number(bonus),
          deduction: Number(deduction),
          notes: payrollNotes,
        }),
      });
      if (res.ok) {
        setShowPayrollModal(false);
        fetchData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkPaid = async (payrollId) => {
    if (!window.confirm('Tandai slip gaji ini telah DIBAYAR (PAID)? Sistem akan otomatis mencatat pengeluaran keuangan.')) return;
    try {
      const res = await fetch(`/api/payrolls/${payrollId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PAID',
          payment_date: new Date().toISOString().split('T')[0],
        }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const calculatedTotal =
    pieceRateTotal + Number(overtime || 0) + Number(bonus || 0) - Number(deduction || 0);

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
              Pegawai Workshop & Penggajian (Payroll)
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Pencatatan data penjahit, pemotong pola, slip gaji, dan perhitungan lembur
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowEmployeeModal(true)}
            >
              <Users size={15} />
              <span>Tambah Pekerja</span>
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                if (employees.length > 0) {
                  handleSelectEmployeeForPayroll(employees[0].id);
                }
                setShowPayrollModal(true);
              }}
            >
              <Plus size={15} />
              <span>Hitung Gaji / Buat Slip</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '20px',
            borderBottom: '1px solid #f1f5f9',
            paddingBottom: '12px',
          }}
        >
          <button
            className={`btn btn-sm ${activeTab === 'payrolls' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('payrolls')}
          >
            <FileText size={15} />
            <span>Riwayat Slip Gaji ({payrolls.length})</span>
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'employees' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('employees')}
          >
            <Users size={15} />
            <span>Master Data Pekerja ({employees.length})</span>
          </button>
        </div>

        {/* TAB 1: PAYROLL HISTORY */}
        {activeTab === 'payrolls' && (
          <>
            {/* Desktop Table View */}
            <div className="desktop-only-table">
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Nama Pegawai & Posisi</th>
                      <th>Periode Gaji</th>
                      <th>Sistem Upah</th>
                      <th className="text-right">Upah Pokok / Borongan</th>
                      <th className="text-right">Lembur & Bonus</th>
                      <th className="text-right">Potongan</th>
                      <th className="text-right">Total Gaji Bersih</th>
                      <th>Status</th>
                      <th className="text-center" style={{ width: '160px' }}>
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrolls.map((prl) => (
                      <tr key={prl.id}>
                        <td>
                          <div style={{ fontWeight: 700 }}>{prl.employee_name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{prl.position}</div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{prl.period}</td>
                        <td>
                          {prl.salary_type === 'PIECE_RATE' ? (
                            <span className="badge" style={{ background: '#e0e7ff', color: '#4338ca', fontSize: '0.75rem' }}>
                              🧵 Borongan ({prl.total_pieces || 0} pcs)
                            </span>
                          ) : (
                            <span className="badge" style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.75rem' }}>
                              {prl.salary_type || 'MONTHLY'}
                            </span>
                          )}
                        </td>
                        <td className="text-right font-mono">
                          Rp {Number(prl.base_salary).toLocaleString('id-ID')}
                          {prl.salary_type === 'PIECE_RATE' && (
                            <div style={{ fontSize: '0.72rem', color: '#6366f1' }}>
                              {prl.total_pieces || 0} pcs selesai
                            </div>
                          )}
                        </td>
                        <td className="text-right font-mono" style={{ color: '#059669' }}>
                          +Rp {(Number(prl.overtime || 0) + Number(prl.bonus || 0)).toLocaleString('id-ID')}
                        </td>
                        <td className="text-right font-mono" style={{ color: '#dc2626' }}>
                          -Rp {Number(prl.deduction || 0).toLocaleString('id-ID')}
                        </td>
                        <td className="text-right font-mono" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#4f46e5' }}>
                          Rp {Number(prl.total_salary).toLocaleString('id-ID')}
                        </td>
                        <td>
                          <span className={`badge badge-${prl.status}`}>
                            {prl.status}
                          </span>
                        </td>
                        <td className="text-center">
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              className="btn btn-secondary btn-sm btn-icon"
                              title="Lihat & Cetak Slip Gaji"
                              onClick={() => setSlipModal(prl)}
                            >
                              <Printer size={15} />
                            </button>
                            {prl.status !== 'PAID' && (
                              <button
                                className="btn btn-success btn-sm"
                                style={{ fontSize: '0.75rem' }}
                                title="Tandai Sudah Dibayar"
                                onClick={() => handleMarkPaid(prl.id)}
                              >
                                <CheckCircle size={14} />
                                <span>Bayar</span>
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
              {payrolls.map((prl) => (
                <div key={prl.id} className="mobile-data-card">
                  <div className="mobile-data-card-header">
                    <div>
                      <div className="mobile-data-card-title">{prl.employee_name}</div>
                      <div className="mobile-data-card-sub">
                        {prl.position} • Periode: <strong>{prl.period}</strong>
                      </div>
                      {prl.salary_type === 'PIECE_RATE' && (
                        <div style={{ marginTop: '4px' }}>
                          <span className="badge" style={{ background: '#e0e7ff', color: '#4338ca', fontSize: '0.72rem' }}>
                            🧵 Borongan ({prl.total_pieces || 0} pcs)
                          </span>
                        </div>
                      )}
                    </div>
                    <span className={`badge badge-${prl.status}`}>
                      {prl.status}
                    </span>
                  </div>

                  <div className="mobile-data-card-grid">
                    <div className="mobile-data-card-field">
                      <span className="mobile-data-card-label">Upah Pokok / Borongan</span>
                      <span className="mobile-data-card-val font-mono" style={{ fontSize: '0.85rem' }}>
                        Rp {Number(prl.base_salary).toLocaleString('id-ID')}
                        {prl.salary_type === 'PIECE_RATE' && (
                          <span style={{ fontSize: '0.75rem', color: '#6366f1', display: 'block' }}>
                            ({prl.total_pieces || 0} pcs)
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="mobile-data-card-field">
                      <span className="mobile-data-card-label">Lembur & Bonus</span>
                      <span className="mobile-data-card-val font-mono" style={{ color: '#059669', fontSize: '0.85rem' }}>
                        +Rp {(Number(prl.overtime || 0) + Number(prl.bonus || 0)).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="mobile-data-card-field">
                      <span className="mobile-data-card-label">Potongan</span>
                      <span className="mobile-data-card-val font-mono" style={{ color: '#dc2626', fontSize: '0.85rem' }}>
                        -Rp {Number(prl.deduction || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="mobile-data-card-field">
                      <span className="mobile-data-card-label">Gaji Bersih Diterima</span>
                      <span className="mobile-data-card-val font-mono" style={{ color: '#4f46e5', fontSize: '1.05rem' }}>
                        Rp {Number(prl.total_salary).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <div className="mobile-data-card-actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSlipModal(prl)}
                    >
                      <Printer size={15} />
                      <span>Cetak Slip Gaji</span>
                    </button>
                    {prl.status !== 'PAID' && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleMarkPaid(prl.id)}
                      >
                        <CheckCircle size={15} />
                        <span>Tandai Lunas</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* TAB 2: EMPLOYEES */}
        {activeTab === 'employees' && (
          <>
            {/* Desktop Table View */}
            <div className="desktop-only-table">
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Kode & Nama Pekerja</th>
                      <th>Posisi Keahlian</th>
                      <th>Kontak Telp</th>
                      <th>Sistem Upah</th>
                      <th className="text-right">Tarif Dasar</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => (
                      <tr key={emp.id}>
                        <td>
                          <div style={{ fontWeight: 700 }}>{emp.name}</div>
                          <div className="font-mono" style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {emp.employee_code}
                          </div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{emp.position}</td>
                        <td style={{ fontSize: '0.85rem' }}>{emp.phone || '-'}</td>
                        <td>
                          {emp.salary_type === 'PIECE_RATE' ? (
                            <span className="badge" style={{ background: '#e0e7ff', color: '#4338ca' }}>
                              🧵 Borongan (Per Pcs)
                            </span>
                          ) : (
                            <span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>
                              {emp.salary_type || 'MONTHLY'}
                            </span>
                          )}
                        </td>
                        <td className="text-right font-mono" style={{ fontWeight: 700 }}>
                          {emp.salary_type === 'PIECE_RATE'
                            ? 'Tarif per Pcs Produk'
                            : `Rp ${Number(emp.base_rate).toLocaleString('id-ID')}`}
                        </td>
                        <td>
                          <span className="badge badge-COMPLETED">Aktif</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards View */}
            <div className="mobile-only-cards">
              {employees.map((emp) => (
                <div key={emp.id} className="mobile-data-card">
                  <div className="mobile-data-card-header">
                    <div>
                      <div className="mobile-data-card-code">{emp.employee_code}</div>
                      <div className="mobile-data-card-title">{emp.name}</div>
                      <div className="mobile-data-card-sub">{emp.position}</div>
                    </div>
                    <span className="badge badge-COMPLETED">Aktif</span>
                  </div>

                  <div className="mobile-data-card-grid">
                    <div className="mobile-data-card-field">
                      <span className="mobile-data-card-label">Sistem Upah</span>
                      <span className="mobile-data-card-val" style={{ fontSize: '0.85rem' }}>
                        {emp.salary_type === 'PIECE_RATE' ? '🧵 Borongan (Per Pcs)' : emp.salary_type}
                      </span>
                    </div>
                    <div className="mobile-data-card-field">
                      <span className="mobile-data-card-label">Tarif Dasar</span>
                      <span className="mobile-data-card-val font-mono" style={{ color: '#0f172a' }}>
                        {emp.salary_type === 'PIECE_RATE'
                          ? 'Per Produk Selesai'
                          : `Rp ${Number(emp.base_rate).toLocaleString('id-ID')}`}
                      </span>
                    </div>
                    <div className="mobile-data-card-field" style={{ gridColumn: 'span 2' }}>
                      <span className="mobile-data-card-label">Kontak Telp / WhatsApp</span>
                      <span className="mobile-data-card-val font-mono" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                        {emp.phone || '-'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal: Tambah Pekerja */}
      {showEmployeeModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">Tambah Pekerja Workshop Baru</div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowEmployeeModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateEmployee}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nama Lengkap Pekerja</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Samsul Bahri"
                    value={empName}
                    onChange={(e) => setEmpName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Posisi / Bagian</label>
                    <select
                      className="form-select"
                      value={empPosition}
                      onChange={(e) => setEmpPosition(e.target.value)}
                    >
                      <option value="Penjahit Utama">Penjahit Utama</option>
                      <option value="Pemotong Pola">Pemotong Pola</option>
                      <option value="Finishing & QC">Finishing & QC</option>
                      <option value="Sablon & Bordir">Sablon & Bordir</option>
                      <option value="Packing & Label">Packing & Label</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">No. Telepon / WhatsApp</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="08123456789"
                      value={empPhone}
                      onChange={(e) => setEmpPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Sistem Penggajian</label>
                    <select
                      className="form-select"
                      value={empSalaryType}
                      onChange={(e) => setEmpSalaryType(e.target.value)}
                    >
                      <option value="PIECE_RATE">🧵 Borongan (Per Pcs Produk Selesai)</option>
                      <option value="MONTHLY">Bulanan Tetap (MONTHLY)</option>
                      <option value="DAILY">Harian (DAILY)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {empSalaryType === 'PIECE_RATE' ? 'Estimasi Upah Jahit / Pcs (Rp)' : 'Tarif Upah Pokok (Rp)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="form-input font-mono"
                      value={empBaseRate}
                      onChange={(e) => setEmpBaseRate(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEmployeeModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  Simpan Pekerja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Hitung Gaji / Buat Slip */}
      {showPayrollModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <div className="modal-title">Perhitungan Slip Gaji (Payroll)</div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowPayrollModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreatePayroll}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Pilih Pekerja</label>
                    <select
                      className="form-select"
                      value={selectedEmpId}
                      onChange={(e) => handleSelectEmployeeForPayroll(e.target.value)}
                      required
                    >
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({emp.position}) - {emp.salary_type === 'PIECE_RATE' ? 'Borongan' : 'Gaji'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Periode Gaji</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Contoh: Oktober 2026"
                      value={period}
                      onChange={(e) => setPeriod(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Sistem Pembayaran Slip Ini</label>
                  <select
                    className="form-select"
                    value={payrollSalaryType}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setPayrollSalaryType(newType);
                      if (newType === 'PIECE_RATE' && productionItems.length === 0) {
                        const firstProd = products[0] || { id: '', name: '', wage_per_piece: 10000 };
                        setProductionItems([
                          {
                            product_id: firstProd.id,
                            product_name: firstProd.name,
                            quantity: 0,
                            wage_per_piece: Number(firstProd.wage_per_piece || 10000),
                            subtotal: 0,
                          },
                        ]);
                      }
                    }}
                  >
                    <option value="PIECE_RATE">🧵 Borongan (Berdasarkan Jumlah Produk Jadi)</option>
                    <option value="MONTHLY">Bulanan Tetap (Nominal Pokok)</option>
                    <option value="DAILY">Harian</option>
                  </select>
                </div>

                {/* PIECE RATE DYNAMIC TABLE */}
                {payrollSalaryType === 'PIECE_RATE' ? (
                  <div
                    style={{
                      background: '#f8fafc',
                      padding: '14px',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      marginBottom: '16px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '10px',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            color: '#1e293b',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <Scissors size={15} color="#4f46e5" />
                          <span>Rincian Produk Yang Dikerjakan Pegawai</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Upah jahit per pcs otomatis ditarik dari produk & terpisah dari harga customer.
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={handleAddProductionRow}
                      >
                        <Plus size={14} />
                        <span>Tambah Produk</span>
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {productionItems.map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'minmax(130px, 1.8fr) 85px 110px 105px 34px',
                            gap: '8px',
                            alignItems: 'center',
                            background: '#fff',
                            padding: '10px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          <div>
                            <label style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginBottom: '2px' }}>
                              Produk
                            </label>
                            <select
                              className="form-select"
                              style={{ fontSize: '0.8rem', padding: '6px 8px' }}
                              value={item.product_id}
                              onChange={(e) => handleProductionItemChange(idx, 'product_id', e.target.value)}
                              required
                            >
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} (Upah: Rp {Number(p.wage_per_piece || 0).toLocaleString('id-ID')})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginBottom: '2px' }}>
                              Qty (Pcs)
                            </label>
                            <input
                              type="number"
                              min="0"
                              className="form-input font-mono"
                              style={{ fontSize: '0.85rem', padding: '6px 8px' }}
                              value={item.quantity}
                              onChange={(e) => handleProductionItemChange(idx, 'quantity', e.target.value)}
                              required
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginBottom: '2px' }}>
                              Upah/Pcs (Rp)
                            </label>
                            <input
                              type="number"
                              min="0"
                              className="form-input font-mono"
                              style={{ fontSize: '0.85rem', padding: '6px 8px' }}
                              value={item.wage_per_piece}
                              onChange={(e) => handleProductionItemChange(idx, 'wage_per_piece', e.target.value)}
                              required
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginBottom: '2px' }}>
                              Subtotal
                            </label>
                            <div className="font-mono" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#4f46e5', paddingTop: '6px' }}>
                              Rp {Number(item.subtotal || 0).toLocaleString('id-ID')}
                            </div>
                          </div>

                          <div style={{ paddingTop: '16px' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm btn-icon"
                              style={{ color: '#ef4444', borderColor: '#fee2e2', background: '#fef2f2' }}
                              onClick={() => handleRemoveProductionRow(idx)}
                              title="Hapus Baris"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        marginTop: '10px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderTop: '1px dashed #cbd5e1',
                        paddingTop: '8px',
                        fontSize: '0.85rem',
                      }}
                    >
                      <span style={{ fontWeight: 600, color: '#475569' }}>
                        Total Hasil: <strong>{totalPiecesOutput} pcs</strong>
                      </span>
                      <span style={{ fontWeight: 700, color: '#1e293b' }}>
                        Subtotal Upah Borongan:{' '}
                        <span className="font-mono" style={{ color: '#4f46e5', fontSize: '0.95rem' }}>
                          Rp {pieceRateTotal.toLocaleString('id-ID')}
                        </span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label className="form-label">Gaji Pokok (Rp)</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input font-mono"
                      value={baseSalary}
                      onChange={(e) => setBaseSalary(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Uang Lembur (Rp)</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input font-mono"
                      value={overtime}
                      onChange={(e) => setOvertime(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Bonus / Insentif (Rp)</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input font-mono"
                      value={bonus}
                      onChange={(e) => setBonus(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Potongan / Kasbon (Rp)</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input font-mono"
                      value={deduction}
                      onChange={(e) => setDeduction(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Catatan Slip</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Contoh: Borongan batch seragam SMP"
                      value={payrollNotes}
                      onChange={(e) => setPayrollNotes(e.target.value)}
                    />
                  </div>
                </div>

                {/* Calculation Snapshot preview */}
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: '#64748b' }}>TOTAL GAJI BERSIH (TAKE HOME):</span>
                    <span className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#4f46e5' }}>
                      Rp {calculatedTotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPayrollModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  Simpan Perhitungan Gaji
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Slip Gaji Modal */}
      {slipModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '620px' }}>
            <div className="modal-header no-print">
              <div className="modal-title">Slip Gaji Karyawan</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
                  <Printer size={15} />
                  <span>Cetak Slip</span>
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setSlipModal(null)}>
                  <X size={15} />
                </button>
              </div>
            </div>

            <div className="modal-body">
              <div className="receipt-paper">
                <div style={{ textAlign: 'center', borderBottom: '2px dashed #cbd5e1', paddingBottom: '16px', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#4f46e5' }}>POLAKAIN NUSANTARA</h3>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                    SLIP GAJI KARYAWAN
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Periode: {slipModal.period}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px', fontSize: '0.85rem' }}>
                  <div>
                    <div style={{ color: '#64748b' }}>Nama Pegawai:</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{slipModal.employee_name}</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748b' }}>Posisi & Sistem:</div>
                    <div style={{ fontWeight: 600 }}>
                      {slipModal.position} • {slipModal.salary_type === 'PIECE_RATE' ? '🧵 Borongan' : slipModal.salary_type || 'Gaji Pokok'}
                    </div>
                  </div>
                </div>

                {/* If Piece-Rate production items exist */}
                {slipModal.production_items && slipModal.production_items.length > 0 && (
                  <div style={{ marginBottom: '16px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1e293b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Scissors size={14} color="#4f46e5" />
                      <span>RINCIAN HASIL JAHIT / BORONGAN:</span>
                    </div>
                    <table className="table" style={{ fontSize: '0.8rem', marginBottom: '0', background: '#fff' }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9' }}>
                          <th>Produk</th>
                          <th className="text-right">Qty</th>
                          <th className="text-right">Upah/Pcs</th>
                          <th className="text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {slipModal.production_items.map((item, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600 }}>{item.product_name}</td>
                            <td className="text-right font-mono">{item.quantity} pcs</td>
                            <td className="text-right font-mono">Rp {Number(item.wage_per_piece).toLocaleString('id-ID')}</td>
                            <td className="text-right font-mono" style={{ fontWeight: 700, color: '#4f46e5' }}>
                              Rp {Number(item.subtotal).toLocaleString('id-ID')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                          <td>Total Output</td>
                          <td className="text-right font-mono">{slipModal.total_pieces || 0} pcs</td>
                          <td></td>
                          <td className="text-right font-mono" style={{ color: '#4f46e5' }}>
                            Rp {Number(slipModal.base_salary).toLocaleString('id-ID')}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                <table className="table" style={{ marginBottom: '16px' }}>
                  <tbody>
                    <tr>
                      <td>{slipModal.salary_type === 'PIECE_RATE' ? 'Total Upah Borongan Produk' : 'Gaji Pokok'}</td>
                      <td className="text-right font-mono">Rp {Number(slipModal.base_salary).toLocaleString('id-ID')}</td>
                    </tr>
                    <tr>
                      <td>Uang Lembur</td>
                      <td className="text-right font-mono" style={{ color: '#059669' }}>+Rp {Number(slipModal.overtime || 0).toLocaleString('id-ID')}</td>
                    </tr>
                    <tr>
                      <td>Bonus & Insentif</td>
                      <td className="text-right font-mono" style={{ color: '#059669' }}>+Rp {Number(slipModal.bonus || 0).toLocaleString('id-ID')}</td>
                    </tr>
                    <tr>
                      <td>Potongan / Kasbon</td>
                      <td className="text-right font-mono" style={{ color: '#dc2626' }}>-Rp {Number(slipModal.deduction || 0).toLocaleString('id-ID')}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td style={{ fontWeight: 800 }}>TOTAL DITERIMA:</td>
                      <td className="text-right font-mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#4f46e5' }}>
                        Rp {Number(slipModal.total_salary).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                <div style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: '1fr 1fr', textAlign: 'center', fontSize: '0.8rem' }}>
                  <div>
                    <div>Penerima,</div>
                    <div style={{ height: '45px' }}></div>
                    <div style={{ fontWeight: 700 }}>({slipModal.employee_name})</div>
                  </div>
                  <div>
                    <div>Manajemen Konveksi,</div>
                    <div style={{ height: '45px' }}></div>
                    <div style={{ fontWeight: 700 }}>Pak Hendra</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer no-print">
              <button className="btn btn-secondary" onClick={() => setSlipModal(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
