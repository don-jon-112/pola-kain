# Changelog

Semua perubahan dan pembaruan versi pada Sistem Manajemen Konveksi (**PolaKain**) didokumentasikan dalam dokumen ini.

---

## [v1.2.0] - 2026-10-08

### Added (Fitur Baru)
- **Rekap Total Pesanan per Jenis Produk (Antrean Aktif)** di menu Pesanan (`OrdersView.jsx`):
  - Agregasi seluruh PO aktif yang sedang berjalan di bengkel konveksi.
  - Kartu metrik KPI: Sisa Antrean Jahit / Kirim (pcs), Total Masuk dalam PO Aktif (pcs), Sudah Terkirim (pcs), dan Model Seragam Dikerjakan.
  - Rincian sisa antrean per variasi ukuran (size breakdown pills) untuk setiap model seragam.
  - Daftar pemesan / lembaga yang menunggu seragam beserta tombol aksi **Kirim** langsung.
- **Sistem Versioning & Changelog Terpusat**:
  - Konfigurasi terpusat di `src/config/version.js` dan sinkronisasi dengan `package.json`.
  - Tampilan versi dinamis dan modal Catatan Rilis (Changelog) interaktif di halaman login.
- **Pengaturan Password Mandiri**:
  - Pengguna dan admin dapat mengganti password akun sendiri langsung dari antarmuka aplikasi.

### Changed & Improved (Perbaikan & Penyempurnaan)
- **Revamp Dashboard Owner (`DashboardView.jsx`)**:
  - Menghapus visualizer alur status pipeline mentah (*REQUESTED*, *CONFIRMED*, *PRODUCTION*, *READY*, *DELIVERING*, *COMPLETED*).
  - Mengganti status transaksi teknis dengan label bahasa Indonesia ramah pengguna (*Aktif Diproses*, *Terkirim Sebagian*, *Selesai*).
  - Menambahkan widget operasional konveksi: **Antrean Produksi & Sisa Kirim Seragam (Work In Progress)** dengan indikator *progress bar* real-time.
  - Menampilkan 4 KPI operasional esensial: Pesanan Aktif (PO), Sisa Antrean Jahit / Kirim, Total Omset Selesai, dan Estimasi Profit Bersih.

---

## [v1.1.0] - 2026-10-07

### Added
- **Multi-Harga per Ukuran Produk (`ProductsView.jsx`)**:
  - Penetapan harga jual berbeda untuk ukuran tertentu pada jenis seragam yang sama (misal: Size 26–30: Rp 85.000, Size 31: Rp 90.000).
- **Pengiriman Bertahap & Faktur Surat Jalan (`DeliveryView.jsx` & `OrdersView.jsx`)**:
  - Fitur kirim bertahap langsung dari kartu pesanan di menu Pesanan.
  - Pembuatan faktur surat jalan resmi otomatis dengan nomor `SJ-YYYY-XXX` dan pelacakan sisa barang.
- **Sistem Gaji Borongan Pegawai (`PayrollView.jsx`)**:
  - Perhitungan gaji berbasis kuantitas hasil produksi jahit per potong pakaian.
  - Cetak slip gaji borongan resmi.
- **Validasi Formulir Pemesanan Customer (`CustomerOrderRequestView.jsx`)**:
  - Validasi ketat pemilihan ukuran seragam sebelum pembuatan order baru.

### Changed
- Konfigurasi produksi siap deploy dengan Firebase (`src/services/firebase.js`), `.env`, `.env.example`, dan `vercel.json`.
- Penghapusan tombol demo switcher dan demo reset button.

---

## [v1.0.0] - 2026-10-01

### Initial Release
- Arsitektur Full-Stack berbasis React 19, Vite 6, dan Node.js Express.
- Sistem Autentikasi Role-Based: `SUPER_ADMIN`, `OWNER`, dan `CUSTOMER`.
- Manajemen Inventori Bahan Baku & Kain dengan deteksi otomatis stok menipis.
- Pencatatan Keuangan, Mutasi Kas, dan Estimasi Laba Bersih.
- Desain UI responsif mobile & desktop menggunakan Vanilla CSS Glassmorphism modern.
