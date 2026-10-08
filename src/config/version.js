export const APP_VERSION = '1.2.0';
export const APP_BUILD_DATE = 'Oktober 2026';
export const APP_NAME = 'PolaKain';

export const CHANGELOG_DATA = [
  {
    version: '1.2.0',
    date: '8 Oktober 2026',
    badge: 'Latest',
    title: 'Rekap Antrean Jahit per Produk & Revamp Owner Dashboard',
    changes: [
      'Fitur Rekap Total Pesanan per Jenis Produk di menu Pesanan (agregasi seluruh PO aktif).',
      'Rincian sisa antrean jahit/potong kain per variasi ukuran (size breakdown).',
      'Revamp Dashboard Owner: penghapusan pipeline status mentah dan penambahan widget Work in Progress (WIP).',
      'Badge status transaksi dengan bahasa manusia (Aktif Diproses, Terkirim Sebagian, Selesai).',
      'Versioning resmi sistem dan modal catatan rilis (Changelog).',
    ],
  },
  {
    version: '1.1.0',
    date: '7 Oktober 2026',
    badge: 'Stable',
    title: 'Multi-Harga per Ukuran, Pengiriman Bertahap & Penggajian Borongan',
    changes: [
      'Dukungan penetapan harga bertingkat untuk variasi ukuran berbeda pada produk yang sama.',
      'Sistem pengiriman bertahap langsung dari kartu pesanan beserta penerbitan faktur surat jalan resmi.',
      'Sistem gaji borongan fleksibel per kuantitas hasil pengerjaan produk seragam.',
      'Validasi formulir pesanan customer untuk mewajibkan pemilihan ukuran sebelum submit.',
      'Konfigurasi environment dan deployment siap produksi (Firebase & Vercel).',
    ],
  },
  {
    version: '1.0.0',
    date: '1 Oktober 2026',
    badge: 'Initial',
    title: 'Rilis Perdana Sistem Operasional Konveksi Terpadu',
    changes: [
      'Manajemen akun dan otentikasi peran (Super Admin, Owner, Customer).',
      'Modul inventori bahan baku dan peringatan stok menipis.',
      'Pencatatan kas operasional dan laporan laba bersih.',
      'Cetak faktur surat jalan dan bukti tanda terima pesanan.',
    ],
  },
];
