import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, Package, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { collection, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';

const safeParseJson = (text, fallback) => {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
};

export default function ProductsView() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('TK');
  const [description, setDescription] = useState('');
  const [singlePrice, setSinglePrice] = useState('');
  const [hasSize, setHasSize] = useState(true);
  const [sizesList, setSizesList] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

  const CATEGORIES = ['TK', 'SD', 'SMP', 'SMA', 'Aksesoris'];

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
      let list = [];

      // 1. Ambil dari Firestore Cloud terlebih dahulu jika terhubung
      if (db) {
        try {
          const snap = await getDocs(collection(db, 'products'));
          if (!snap.empty) {
            list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          }
        } catch (fErr) {
          console.warn('Firestore fetch products notice:', fErr.message);
        }
      }

      // 2. Ambil dari backend lokal jika Firestore belum ada data atau untuk fallback
      if (list.length === 0) {
        try {
          const res = await fetch('/api/products');
          const text = await res.text();
          const data = safeParseJson(text, null);
          if (Array.isArray(data)) {
            list = data;
          }
        } catch (apiErr) {
          console.warn('API fetch products fallback notice:', apiErr.message);
        }
      }

      // Urutkan produk agar produk terbaru berada di atas
      list.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });

      setProducts(list);
    } catch (err) {
      console.error('Error fetching products:', err);
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
    setCategory('TK');
    setDescription('');
    setSinglePrice('');
    setHasSize(true);
    setSizesList([]); // Default kosong tanpa ukuran bawaan
    setError('');
    setShowModal(true);
  };

  const openEditModal = (prod) => {
    setEditingProduct(prod);
    setName(prod.name);
    setCode(prod.code);
    setCategory(prod.category || 'TK');
    setDescription(prod.description || '');
    setSinglePrice(prod.price ? String(prod.price) : '');
    setHasSize(prod.has_size);
    const existingSizes = (prod.sizes || []).map((s) => ({
      size_code: s.size_code,
      size_name: s.size_name || `Size ${s.size_code}`,
      price: s.price !== undefined && s.price !== null ? String(s.price) : String(prod.price || ''),
    }));
    setSizesList(existingSizes);
    setError('');
    setShowModal(true);
  };

  const handleAddSizeRow = () => {
    // Biarkan nilai baru kosong untuk diisi oleh user
    setSizesList([...sizesList, { size_code: '', size_name: '', price: '' }]);
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

    if (!name || !name.trim()) {
      setError('Nama produk wajib diisi');
      return;
    }

    setSubmitting(true);
    try {
      // Parse sizes
      const parsedSizes = hasSize
        ? sizesList
            .filter((s) => s.size_code && s.size_code.trim())
            .map((s, idx) => ({
              id: s.id || `psz_${Date.now()}_${idx}`,
              size_code: s.size_code.trim(),
              size_name: s.size_name?.trim() || `Size ${s.size_code.trim()}`,
              price: Number(s.price || 0),
              sort_order: idx + 1,
              active: true,
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
      const targetId = editingProduct ? editingProduct.id : `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const generatedCode = code.trim() || `PRD-${Date.now().toString().slice(-4)}`;

      const productPayload = {
        id: targetId,
        code: generatedCode,
        name: name.trim(),
        category,
        description: description.trim(),
        price: effectivePrice,
        wage_per_piece: editingProduct?.wage_per_piece !== undefined ? Number(editingProduct.wage_per_piece) : 10000,
        has_size: hasSize,
        sizes: parsedSizes,
        active: editingProduct?.active !== undefined ? editingProduct.active : true,
        created_at: editingProduct?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // 1. Simpan langsung ke Firebase Firestore jika terhubung
      let savedToFirestore = false;
      if (db) {
        try {
          await setDoc(doc(db, 'products', targetId), productPayload, { merge: true });
          savedToFirestore = true;
          console.log('✅ Produk berhasil disimpan ke Cloud Firestore:', targetId);
        } catch (fErr) {
          console.error('Firestore save product error:', fErr);
          if (fErr.code === 'permission-denied') {
            throw new Error('Akses Cloud Firestore ditolak. Pastikan Firestore Security Rules sudah di-publish.');
          }
        }
      }

      // 2. Sinkronkan ke API backend lokal jika tersedia
      try {
        const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
        const method = editingProduct ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productPayload),
        });

        const text = await res.text();
        const data = safeParseJson(text, null);

        if (!res.ok) {
          // Jika tidak berhasil disimpan ke Firestore dan API gagal, lempar error
          if (!savedToFirestore) {
            throw new Error((data && data.error) || `Gagal menyimpan ke server (status ${res.status})`);
          }
        }
      } catch (apiErr) {
        // Jika sudah tersimpan di Firestore (misalnya saat dideploy ke Vercel tanpa backend Express),
        // abaikan error koneksi backend lokal.
        if (!savedToFirestore) {
          throw apiErr;
        }
        console.warn('API backend lokal tidak tersedia, data disimpan di Cloud Firestore.');
      }

      setShowModal(false);
      await fetchProducts();
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan sistem saat menyimpan produk');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleDeactivate = async (id, currentActive) => {
    if (!window.confirm(`Yakin ingin ${currentActive ? 'menonaktifkan' : 'mengaktifkan'} produk ini?`)) return;

    try {
      const newActive = !currentActive;

      // 1. Update ke Firebase Firestore
      if (db) {
        try {
          await updateDoc(doc(db, 'products', id), {
            active: newActive,
            updated_at: new Date().toISOString(),
          });
        } catch (fErr) {
          console.warn('Firestore update status notice:', fErr.message);
        }
      }

      // 2. Update ke API backend lokal
      try {
        await fetch(`/api/products/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ active: newActive }),
        });
      } catch (apiErr) {
        // silent
      }

      await fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProducts = products.filter((prod) => {
    if (selectedCategoryFilter === 'ALL') return true;
    return prod.category === selectedCategoryFilter;
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
            marginBottom: '16px',
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

        {/* Filter Tabs Kategori */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#64748b', marginRight: '4px' }}>
            Filter Kategori:
          </span>
          {['ALL', ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              type="button"
              className={`btn btn-sm ${selectedCategoryFilter === cat ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                padding: '4px 12px',
                fontSize: '0.8rem',
                borderRadius: '20px',
                fontWeight: selectedCategoryFilter === cat ? 700 : 500,
              }}
              onClick={() => setSelectedCategoryFilter(cat)}
            >
              {cat === 'ALL' ? 'Semua' : cat}
              {cat !== 'ALL' && (
                <span style={{ opacity: 0.75, marginLeft: '4px', fontSize: '0.75rem' }}>
                  ({products.filter((p) => p.category === cat).length})
                </span>
              )}
            </button>
          ))}
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
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                          Tidak ada produk dalam kategori <strong>{selectedCategoryFilter}</strong>.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((prod) => (
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
                    ))
                  )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards View */}
            <div className="mobile-only-cards">
              {filteredProducts.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '12px' }}>
                  Tidak ada produk dalam kategori <strong>{selectedCategoryFilter}</strong>.
                </div>
              ) : (
                filteredProducts.map((prod) => (
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
              ))
            )}
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
                      <option value="TK">TK</option>
                      <option value="SD">SD</option>
                      <option value="SMP">SMP</option>
                      <option value="SMA">SMA</option>
                      <option value="Aksesoris">Aksesoris</option>
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
                      className="form-input text-right"
                      style={{
                        height: '38px',
                        fontFamily: 'inherit',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        color: '#0f172a',
                        letterSpacing: '0.02em',
                      }}
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
                          <div style={{ padding: '24px 16px', background: '#ffffff', borderRadius: '8px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', border: '1px dashed #cbd5e1' }}>
                            Ukuran saat ini masih kosong. Klik tombol <strong>'Tambah Ukuran'</strong> di atas untuk menambahkan ukuran & harganya.
                          </div>
                        ) : (
                          <div style={{ maxHeight: '260px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#ffffff' }}>
                            <table className="table" style={{ margin: 0, fontSize: '0.85rem' }}>
                              <thead style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
                                <tr>
                                  <th style={{ padding: '8px 10px' }}>Kode Ukuran</th>
                                  <th style={{ padding: '8px 10px' }}>Nama Label</th>
                                  <th style={{ padding: '8px 10px', width: '160px' }}>Harga Jual (Rp)</th>
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
                                        style={{ height: '34px', fontSize: '0.85rem', fontWeight: 600 }}
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
                                        style={{ height: '34px', fontSize: '0.85rem' }}
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
                                        className="form-input text-right"
                                        style={{
                                          height: '34px',
                                          fontFamily: 'inherit',
                                          fontSize: '0.875rem',
                                          fontWeight: 700,
                                          color: '#0f172a',
                                          letterSpacing: '0.02em',
                                        }}
                                        placeholder="Masukkan harga"
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
                          💡 Harga ditentukan langsung pada masing-masing ukuran produk.
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Deskripsi & Spesifikasi Bahan</label>
                  <textarea
                    className="form-input"
                    rows={5}
                    style={{
                      resize: 'none',
                      minHeight: '115px',
                      height: '115px',
                      lineHeight: '1.5',
                      padding: '10px 12px',
                      fontFamily: 'inherit',
                      fontSize: '0.85rem',
                    }}
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
