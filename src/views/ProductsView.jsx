import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, Package, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ProductsView() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('Seragam Putih');
  const [description, setDescription] = useState('');
  const [singlePrice, setSinglePrice] = useState('85000');
  const [hasSize, setHasSize] = useState(true);
  const [sizesList, setSizesList] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const getProductPriceDisplay = (prod) => {
    if (!prod.has_size || !prod.sizes || prod.sizes.length === 0) {
      return `Rp ${Number(prod.price).toLocaleString('id-ID')}`;
    }
    const prices = prod.sizes.map((s) => (s.price !== undefined && s.price !== null ? Number(s.price) : Number(prod.price)));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    if (minPrice === maxPrice) {
      return `Rp ${minPrice.toLocaleString('id-ID')}`;
    }
    return `Rp ${minPrice.toLocaleString('id-ID')} - Rp ${maxPrice.toLocaleString('id-ID')}`;
  };

  const hasVariantPricing = (prod) => {
    if (!prod.has_size || !prod.sizes || prod.sizes.length === 0) return false;
    const prices = prod.sizes.map((s) => (s.price !== undefined && s.price !== null ? Number(s.price) : Number(prod.price)));
    return Math.min(...prices) !== Math.max(...prices);
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setCode('');
    setCategory('Seragam Putih');
    setDescription('');
    setSinglePrice('85000');
    setHasSize(true);
    setSizesList([
      { size_code: '26', size_name: 'Size 26', price: '85000' },
      { size_code: '27', size_name: 'Size 27', price: '85000' },
      { size_code: '28', size_name: 'Size 28', price: '85000' },
      { size_code: '29', size_name: 'Size 29', price: '85000' },
      { size_code: '30', size_name: 'Size 30', price: '85000' },
      { size_code: '31', size_name: 'Size 31 (Jumbo)', price: '90000' },
    ]);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (prod) => {
    setEditingProduct(prod);
    setName(prod.name);
    setCode(prod.code);
    setCategory(prod.category);
    setDescription(prod.description);
    setSinglePrice(prod.price || '85000');
    setHasSize(prod.has_size);
    const existingSizes = (prod.sizes || []).map((s) => ({
      size_code: s.size_code,
      size_name: s.size_name || `Size ${s.size_code}`,
      price: s.price !== undefined && s.price !== null ? s.price : prod.price,
    }));
    setSizesList(existingSizes);
    setError('');
    setShowModal(true);
  };

  const handleAddSizeRow = () => {
    const lastPrice = sizesList.length > 0 ? sizesList[sizesList.length - 1].price : '85000';
    setSizesList([...sizesList, { size_code: '', size_name: '', price: lastPrice }]);
  };

  const handleRemoveSizeRow = (idx) => {
    setSizesList(sizesList.filter((_, i) => i !== idx));
  };

  const handleSizeItemChange = (idx, field, val) => {
    setSizesList(
      sizesList.map((item, i) => {
        if (i !== idx) return item;
        return { ...item, [field]: val };
      })
    );
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setError('');

    if (!name) {
      setError('Nama produk wajib diisi');
      return;
    }

    setSubmitting(true);
    try {
      // Parse sizes
      const parsedSizes = hasSize
        ? sizesList
            .filter((s) => s.size_code && s.size_code.trim())
            .map((s) => ({
              size_code: s.size_code.trim(),
              size_name: s.size_name?.trim() || `Size ${s.size_code.trim()}`,
              price: Number(s.price || 0),
            }))
        : [];

      if (hasSize && parsedSizes.length === 0) {
        throw new Error('Produk dengan multi-ukuran wajib memiliki minimal 1 ukuran beserta harganya.');
      }

      if (hasSize) {
        const invalidPrice = parsedSizes.find((s) => !s.price || s.price <= 0);
        if (invalidPrice) {
          throw new Error(`Harga untuk ukuran ${invalidPrice.size_code} wajib diisi dengan benar.`);
        }
      } else if (!singlePrice || Number(singlePrice) <= 0) {
        throw new Error('Harga jual produk wajib diisi.');
      }

      const effectivePrice = hasSize && parsedSizes.length > 0 ? parsedSizes[0].price : Number(singlePrice);

      const payload = {
        name,
        code,
        category,
        description,
        price: effectivePrice,
        has_size: hasSize,
        sizes: parsedSizes,
      };

      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan produk');
      }

      setShowModal(false);
      fetchProducts();
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleDeactivate = async (id, currentActive) => {
    if (!window.confirm(`Yakin ingin ${currentActive ? 'menonaktifkan' : 'mengaktifkan'} produk ini?`)) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      });
      if (res.ok) {
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
    }
  };

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
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Master Katalog Produk & Ukuran</h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Pengaturan harga dan varian ukuran seragam. Riwayat order sebelumnya tidak akan terpengaruh jika harga diubah.
            </p>
          </div>

          <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
            <Plus size={16} />
            <span>Tambah Produk Baru</span>
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Memuat katalog produk...</div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="desktop-only-table">
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Kode & Nama Produk</th>
                      <th>Kategori</th>
                      <th>Tipe Ukuran</th>
                      <th>Daftar Size Aktif</th>
                      <th className="text-right">Harga Jual Saat Ini</th>
                      <th>Status</th>
                      <th className="text-center" style={{ width: '110px' }}>
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((prod) => (
                      <tr key={prod.id} style={{ opacity: prod.active ? 1 : 0.6 }}>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{prod.name}</div>
                          <div className="font-mono" style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {prod.code}
                          </div>
                        </td>
                        <td>
                          <span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>
                            {prod.category}
                          </span>
                        </td>
                        <td>
                          {prod.has_size ? (
                            <span style={{ fontSize: '0.8rem', color: '#4f46e5', fontWeight: 600 }}>
                              Multi-Ukuran
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                              Satu Ukuran
                            </span>
                          )}
                        </td>
                        <td>
                          {prod.has_size ? (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              {(prod.sizes || []).map((sz) => {
                                const isCustomPrice = sz.price && Number(sz.price) !== Number(prod.price);
                                return (
                                   <span
                                    key={sz.id || sz.size_code}
                                    style={{
                                      background: isCustomPrice ? '#fef3c7' : '#e0e7ff',
                                      color: isCustomPrice ? '#92400e' : '#3730a3',
                                      border: isCustomPrice ? '1px solid #fde68a' : 'none',
                                      fontSize: '0.75rem',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      fontWeight: 600,
                                    }}
                                    title={isCustomPrice ? `Harga khusus: Rp ${Number(sz.price).toLocaleString('id-ID')}` : undefined}
                                  >
                                    {sz.size_code}
                                    {isCustomPrice && ` (${Math.round(sz.price / 1000)}k)`}
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>-</span>
                          )}
                        </td>
                        <td className="text-right font-mono" style={{ fontWeight: 700, color: '#0f172a' }}>
                          <div>{getProductPriceDisplay(prod)}</div>
                          {hasVariantPricing(prod) && (
                            <div style={{ fontSize: '0.7rem', color: '#d97706', fontWeight: 600 }}>
                              Harga beda per ukuran
                            </div>
                          )}
                        </td>
                        <td>
                          {prod.active ? (
                            <span className="badge badge-COMPLETED">
                              <CheckCircle2 size={12} />
                              Aktif
                            </span>
                          ) : (
                            <span className="badge badge-REJECTED">
                              <XCircle size={12} />
                              Nonaktif
                            </span>
                          )}
                        </td>
                        <td className="text-center">
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              className="btn btn-secondary btn-sm btn-icon"
                              title="Edit Produk & Harga"
                              onClick={() => openEditModal(prod)}
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              className="btn btn-secondary btn-sm btn-icon"
                              style={{ color: prod.active ? '#ef4444' : '#10b981' }}
                              title={prod.active ? 'Nonaktifkan (Soft Delete)' : 'Aktifkan Kembali'}
                              onClick={() => handleToggleDeactivate(prod.id, prod.active)}
                            >
                              {prod.active ? <Trash2 size={15} /> : <CheckCircle2 size={15} />}
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
              {products.map((prod) => (
                <div key={prod.id} className="mobile-data-card" style={{ opacity: prod.active ? 1 : 0.65 }}>
                  <div className="mobile-data-card-header">
                    <div>
                      <div className="mobile-data-card-code">{prod.code}</div>
                      <div className="mobile-data-card-title">{prod.name}</div>
                      <div className="mobile-data-card-sub">Kategori: <strong>{prod.category}</strong></div>
                    </div>
                    {prod.active ? (
                      <span className="badge badge-COMPLETED">
                        <CheckCircle2 size={12} />
                        Aktif
                      </span>
                    ) : (
                      <span className="badge badge-REJECTED">
                        <XCircle size={12} />
                        Nonaktif
                      </span>
                    )}
                  </div>

                  <div className="mobile-data-card-grid">
                    <div className="mobile-data-card-field">
                      <span className="mobile-data-card-label">Harga Satuan</span>
                      <span className="mobile-data-card-val font-mono" style={{ color: '#4f46e5' }}>
                        {getProductPriceDisplay(prod)}
                      </span>
                      {hasVariantPricing(prod) && (
                        <div style={{ fontSize: '0.7rem', color: '#d97706', fontWeight: 600, marginTop: '2px' }}>
                          Beda per ukuran
                        </div>
                      )}
                    </div>
                    <div className="mobile-data-card-field">
                      <span className="mobile-data-card-label">Tipe Ukuran</span>
                      <span className="mobile-data-card-val" style={{ fontSize: '0.8rem' }}>
                        {prod.has_size ? 'Multi-Ukuran' : 'Satu Ukuran'}
                      </span>
                    </div>
                  </div>

                  {prod.has_size && (
                    <div style={{ marginTop: '2px' }}>
                      <span className="mobile-data-card-label" style={{ display: 'block', marginBottom: '4px' }}>
                        Pilihan Ukuran:
                      </span>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        {(prod.sizes || []).map((sz) => (
                          <span
                            key={sz.id || sz.size_code}
                            style={{
                              background: '#e0e7ff',
                              color: '#3730a3',
                              fontSize: '0.75rem',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontWeight: 700,
                            }}
                          >
                            {sz.size_code}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mobile-data-card-actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => openEditModal(prod)}
                    >
                      <Edit2 size={15} />
                      <span>Edit Produk</span>
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ color: prod.active ? '#ef4444' : '#10b981' }}
                      onClick={() => handleToggleDeactivate(prod.id, prod.active)}
                    >
                      {prod.active ? <Trash2 size={15} /> : <CheckCircle2 size={15} />}
                      <span>{prod.active ? 'Nonaktifkan' : 'Aktifkan'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">
                {editingProduct ? 'Edit Master Produk' : 'Tambah Produk Baru'}
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct}>
              <div className="modal-body">
                {error && (
                  <div
                    style={{
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#b91c1c',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      marginBottom: '16px',
                    }}
                  >
                    {error}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Nama Produk Seragam</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Kemeja Batik TK/SD Lengan Panjang"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Kode Produk (SKU)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Contoh: KBT-TK"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Kategori</label>
                    <select
                      className="form-select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="Seragam Putih">Seragam Putih</option>
                      <option value="Seragam Batik">Seragam Batik</option>
                      <option value="Seragam Pramuka">Seragam Pramuka</option>
                      <option value="Seragam Olahraga">Seragam Olahraga</option>
                      <option value="Aksesoris">Aksesoris (Dasi, Topi, Sabuk)</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                </div>

                {/* If product has no size variant (Satu Ukuran), show simple price input */}
                {!hasSize && (
                  <div className="form-group">
                    <label className="form-label">Harga Jual ke Customer (Rp)</label>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      className="form-input font-mono"
                      placeholder="Contoh: 85000"
                      value={singlePrice}
                      onChange={(e) => setSinglePrice(e.target.value)}
                      required
                    />
                    <div className="form-help">
                      Harga jual untuk produk yang tidak memiliki variasi ukuran.
                    </div>
                  </div>
                )}

                <div className="form-group" style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 700, color: '#1e293b' }}>
                    <input
                      type="checkbox"
                      checked={hasSize}
                      onChange={(e) => setHasSize(e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: '#4f46e5' }}
                    />
                    <span>Produk memiliki variasi ukuran</span>
                  </label>

                  {hasSize && (
                    <div style={{ marginTop: '14px' }}>
                      {/* Tabel Variasi & Harga per Ukuran */}
                      <div style={{ marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                            Daftar Ukuran & Harga Jual ({sizesList.length} varian):
                          </span>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                            onClick={handleAddSizeRow}
                          >
                            <Plus size={13} />
                            <span>Tambah Ukuran</span>
                          </button>
                        </div>

                        {sizesList.length === 0 ? (
                          <div style={{ padding: '16px', background: '#ffffff', borderRadius: '8px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                            Belum ada ukuran. Klik 'Tambah Ukuran' untuk menambahkan varian ukuran & harga.
                          </div>
                        ) : (
                          <div style={{ maxHeight: '260px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#ffffff' }}>
                            <table className="table" style={{ margin: 0, fontSize: '0.85rem' }}>
                              <thead style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
                                <tr>
                                  <th style={{ padding: '8px 10px' }}>Kode Ukuran</th>
                                  <th style={{ padding: '8px 10px' }}>Nama Label</th>
                                  <th style={{ padding: '8px 10px', width: '150px' }}>Harga Jual (Rp)</th>
                                  <th style={{ padding: '8px 10px', width: '45px', textAlign: 'center' }}></th>
                                </tr>
                              </thead>
                              <tbody>
                                {sizesList.map((sz, idx) => (
                                  <tr key={idx}>
                                    <td style={{ padding: '6px 10px' }}>
                                      <input
                                        type="text"
                                        className="form-input"
                                        style={{ height: '32px', fontSize: '0.8rem', fontWeight: 600 }}
                                        placeholder="Misal: 31 atau XL"
                                        value={sz.size_code}
                                        onChange={(e) => handleSizeItemChange(idx, 'size_code', e.target.value)}
                                        required
                                      />
                                    </td>
                                    <td style={{ padding: '6px 10px' }}>
                                      <input
                                        type="text"
                                        className="form-input"
                                        style={{ height: '32px', fontSize: '0.8rem' }}
                                        placeholder={`Size ${sz.size_code || ''}`}
                                        value={sz.size_name}
                                        onChange={(e) => handleSizeItemChange(idx, 'size_name', e.target.value)}
                                      />
                                    </td>
                                    <td style={{ padding: '6px 10px' }}>
                                      <input
                                        type="number"
                                        min="0"
                                        step="500"
                                        className="form-input font-mono text-right"
                                        style={{ height: '32px', fontSize: '0.8rem', fontWeight: 700 }}
                                        placeholder="85000"
                                        value={sz.price}
                                        onChange={(e) => handleSizeItemChange(idx, 'price', e.target.value)}
                                        required
                                      />
                                    </td>
                                    <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                                      <button
                                        type="button"
                                        className="btn btn-secondary btn-sm btn-icon"
                                        style={{ color: '#ef4444', height: '30px', width: '30px' }}
                                        onClick={() => handleRemoveSizeRow(idx)}
                                        title="Hapus varian ukuran"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        <div className="form-help" style={{ marginTop: '6px' }}>
                          💡 Harga ditentukan langsung pada masing-masing ukuran (misal: ukuran 26-30 seharga <strong>Rp 85.000</strong>, dan ukuran 31 seharga <strong>Rp 90.000</strong>).
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Deskripsi & Spesifikasi Bahan</label>
                  <textarea
                    className="form-textarea"
                    rows="2"
                    placeholder="Contoh: Bahan TC Oxford tebal adem, kancing kuat, jahitan rapi."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Menyimpan...' : 'Simpan Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
