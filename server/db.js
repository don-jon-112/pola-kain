import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'konveksi.db.json');

// Initial seed dataset
function getInitialData() {
  return {
    users: [
      {
        id: 'usr_superadmin',
        username: 'superadmin',
        email: 'superadmin@konveksi.id',
        password: 'password123',
        name: 'Super Admin Utama',
        role: 'SUPER_ADMIN',
        customer_id: null,
        must_change_password: false,
        active: true,
        created_at: '2026-10-01T08:00:00Z',
      },
      {
        id: 'usr_owner',
        username: 'owner',
        email: 'owner@konveksi.id',
        password: 'password123',
        name: 'Pak Hendra (Owner)',
        role: 'OWNER',
        customer_id: null,
        must_change_password: false,
        active: true,
        created_at: '2026-10-01T08:00:00Z',
      },
      {
        id: 'usr_cust_smp',
        username: 'cust_smp',
        email: 'admin@smpharapan.sch.id',
        password: 'password123',
        name: 'SMP Harapan Bangsa (Ibu Lina)',
        role: 'CUSTOMER',
        customer_id: 'cust_01',
        must_change_password: false,
        active: true,
        created_at: '2026-10-02T09:00:00Z',
      },
      {
        id: 'usr_cust_sd',
        username: 'cust_sd',
        email: 'sdpertiwi@gmail.com',
        password: 'password123',
        name: 'SD Pertiwi 01 (Pak Joko)',
        role: 'CUSTOMER',
        customer_id: 'cust_02',
        must_change_password: true, // Demo for First Login Change Password!
        active: true,
        created_at: '2026-10-07T10:00:00Z',
      },
    ],
    customers: [
      {
        id: 'cust_01',
        code: 'CST-001',
        name: 'SMP Harapan Bangsa',
        pic: 'Ibu Lina (Kesiswaan)',
        phone: '081234567890',
        email: 'admin@smpharapan.sch.id',
        address: 'Jl. Merdeka No. 45, Jakarta Selatan',
        created_at: '2026-10-02T09:00:00Z',
      },
      {
        id: 'cust_02',
        code: 'CST-002',
        name: 'SD Pertiwi 01',
        pic: 'Pak Joko (Kepala Tata Usaha)',
        phone: '081398765432',
        email: 'sdpertiwi@gmail.com',
        address: 'Jl. Melati Raya No. 12, Jakarta Timur',
        created_at: '2026-10-07T10:00:00Z',
      },
      {
        id: 'cust_03',
        code: 'CST-003',
        name: 'SMA Negeri 5 Unggulan',
        pic: 'Ibu Ratna',
        phone: '085711223344',
        email: 'sman5@sch.id',
        address: 'Jl. Pemuda No. 88, Bekasi',
        created_at: '2026-10-08T11:00:00Z',
      },
    ],
    products: [
      {
        id: 'prod_1',
        code: 'KBT-TK',
        name: 'Kemeja Batik TK/SD',
        description: 'Bahan katun prima lembut, motif batik parang nasional.',
        category: 'TK',
        has_size: true,
        price: 75000,
        wage_per_piece: 10000,
        active: true,
        created_at: '2026-10-01T10:00:00Z',
        updated_at: '2026-10-01T10:00:00Z',
      },
      {
        id: 'prod_2',
        code: 'KPT-SMP',
        name: 'Kemeja Putih SMP Lengan Pendek',
        description: 'Bahan TC Oxford tebal adem, bordir saku logo bendera.',
        category: 'SMP',
        has_size: true,
        price: 65000,
        wage_per_piece: 8500,
        active: true,
        created_at: '2026-10-01T10:00:00Z',
        updated_at: '2026-10-01T10:00:00Z',
      },
      {
        id: 'prod_3',
        code: 'CLN-PRM',
        name: 'Celana Panjang Pramuka SMP/SMA',
        description: 'Bahan drill kuat warna coklat tua, karet pinggang fleksibel.',
        category: 'SMA',
        has_size: true,
        price: 85000,
        wage_per_piece: 12000,
        active: true,
        created_at: '2026-10-01T10:00:00Z',
        updated_at: '2026-10-01T10:00:00Z',
      },
      {
        id: 'prod_4',
        code: 'DSI-SD',
        name: 'Dasi Bordir SD Merah',
        description: 'Dasi bahan drill merah dengan bordir Tut Wuri Handayani.',
        category: 'Aksesoris',
        has_size: false,
        price: 15000,
        wage_per_piece: 2000,
        active: true,
        created_at: '2026-10-01T10:00:00Z',
        updated_at: '2026-10-01T10:00:00Z',
      },
      {
        id: 'prod_5',
        code: 'TPI-SD',
        name: 'Topi SD Merah Putih Bordir',
        description: 'Topi seragam SD bahan drill dengan pengatur ukuran belakang.',
        category: 'Aksesoris',
        has_size: false,
        price: 17500,
        wage_per_piece: 2500,
        active: true,
        created_at: '2026-10-01T10:00:00Z',
        updated_at: '2026-10-01T10:00:00Z',
      },
      {
        id: 'prod_6',
        code: 'KOS-OLG',
        name: 'Setelan Kaos Olahraga SD',
        description: 'Atasan katun combed 24s + celana training diadora.',
        category: 'SD',
        has_size: true,
        price: 95000,
        wage_per_piece: 15000,
        active: true,
        created_at: '2026-10-01T10:00:00Z',
        updated_at: '2026-10-01T10:00:00Z',
      },
    ],
    product_sizes: [
      { id: 'psz_1_1', product_id: 'prod_1', size_code: '1', size_name: 'Size 1 (Lingkar Dada 72cm)', sort_order: 1, active: true },
      { id: 'psz_1_2', product_id: 'prod_1', size_code: '2', size_name: 'Size 2 (Lingkar Dada 76cm)', sort_order: 2, active: true },
      { id: 'psz_1_3', product_id: 'prod_1', size_code: '3', size_name: 'Size 3 (Lingkar Dada 80cm)', sort_order: 3, active: true },
      { id: 'psz_1_4', product_id: 'prod_1', size_code: '4', size_name: 'Size 4 (Lingkar Dada 84cm)', sort_order: 4, active: true },
      { id: 'psz_1_5', product_id: 'prod_1', size_code: '5', size_name: 'Size 5 (Lingkar Dada 88cm)', sort_order: 5, active: true },
      { id: 'psz_1_6', product_id: 'prod_1', size_code: '6', size_name: 'Size 6 (Lingkar Dada 92cm)', sort_order: 6, active: true },

      { id: 'psz_2_10', product_id: 'prod_2', size_code: '10', size_name: 'Size 10 (SMP Kelas 7 Kecil)', sort_order: 1, active: true },
      { id: 'psz_2_11', product_id: 'prod_2', size_code: '11', size_name: 'Size 11 (SMP Kelas 7 Sedang)', sort_order: 2, active: true },
      { id: 'psz_2_12', product_id: 'prod_2', size_code: '12', size_name: 'Size 12 (SMP Standar)', sort_order: 3, active: true },
      { id: 'psz_2_13', product_id: 'prod_2', size_code: '13', size_name: 'Size 13 (SMP Besar)', sort_order: 4, active: true },
      { id: 'psz_2_14', product_id: 'prod_2', size_code: '14', size_name: 'Size 14 (SMP Jumbo)', sort_order: 5, active: true },

      { id: 'psz_3_26', product_id: 'prod_3', size_code: '26', size_name: 'Size 26', price: 85000, sort_order: 1, active: true },
      { id: 'psz_3_27', product_id: 'prod_3', size_code: '27', size_name: 'Size 27', price: 85000, sort_order: 2, active: true },
      { id: 'psz_3_28', product_id: 'prod_3', size_code: '28', size_name: 'Size 28', price: 85000, sort_order: 3, active: true },
      { id: 'psz_3_29', product_id: 'prod_3', size_code: '29', size_name: 'Size 29', price: 85000, sort_order: 4, active: true },
      { id: 'psz_3_30', product_id: 'prod_3', size_code: '30', size_name: 'Size 30', price: 85000, sort_order: 5, active: true },
      { id: 'psz_3_31', product_id: 'prod_3', size_code: '31', size_name: 'Size 31 (Jumbo)', price: 90000, sort_order: 6, active: true },

      { id: 'psz_6_S', product_id: 'prod_6', size_code: 'S', size_name: 'Size S', sort_order: 1, active: true },
      { id: 'psz_6_M', product_id: 'prod_6', size_code: 'M', size_name: 'Size M', sort_order: 2, active: true },
      { id: 'psz_6_L', product_id: 'prod_6', size_code: 'L', size_name: 'Size L', sort_order: 3, active: true },
      { id: 'psz_6_XL', product_id: 'prod_6', size_code: 'XL', size_name: 'Size XL', sort_order: 4, active: true },
    ],
    orders: [
      {
        id: 'ord_1',
        order_number: 'ORD-2026-001',
        customer_id: 'cust_01',
        customer_name: 'SMP Harapan Bangsa',
        customer_phone: '081234567890',
        customer_address: 'Jl. Merdeka No. 45, Jakarta Selatan',
        status: 'COMPLETED',
        total_amount: 3200000,
        customer_message: 'Harap dikirim rapi per kelas dalam plastik tersegel.',
        created_by: 'usr_cust_smp',
        created_at: '2026-10-01T09:30:00Z',
        updated_at: '2026-10-06T15:00:00Z',
      },
      {
        id: 'ord_2',
        order_number: 'ORD-2026-002',
        customer_id: 'cust_01',
        customer_name: 'SMP Harapan Bangsa',
        customer_phone: '081234567890',
        customer_address: 'Jl. Merdeka No. 45, Jakarta Selatan',
        status: 'PRODUCTION',
        total_amount: 4725000,
        customer_message: 'Pesanan tambahan untuk ekstrakurikuler Pramuka dan Upacara.',
        created_by: 'usr_cust_smp',
        created_at: '2026-10-05T11:15:00Z',
        updated_at: '2026-10-06T10:00:00Z',
      },
      {
        id: 'ord_3',
        order_number: 'ORD-2026-003',
        customer_id: 'cust_02',
        customer_name: 'SD Pertiwi 01',
        customer_phone: '081398765432',
        customer_address: 'Jl. Melati Raya No. 12, Jakarta Timur',
        status: 'REQUESTED',
        total_amount: 2550000,
        customer_message: 'Mohon selesai dan bisa dikirim sebelum tanggal 20 Oktober 2026.',
        created_by: 'usr_cust_sd',
        created_at: '2026-10-08T08:45:00Z',
        updated_at: '2026-10-08T08:45:00Z',
      },
    ],
    order_items: [
      // Items for ORD-2026-001 (SNAPSHOT data)
      {
        id: 'oit_1_1',
        order_id: 'ord_1',
        product_id: 'prod_2',
        product_code: 'KPT-SMP',
        product_name: 'Kemeja Putih SMP Lengan Pendek',
        size_code: '11',
        size_name: 'Size 11 (SMP Kelas 7 Sedang)',
        quantity: 20,
        shipped_quantity: 20,
        unit_price: 65000,
        total_price: 1300000,
      },
      {
        id: 'oit_1_2',
        order_id: 'ord_1',
        product_id: 'prod_2',
        product_code: 'KPT-SMP',
        product_name: 'Kemeja Putih SMP Lengan Pendek',
        size_code: '12',
        size_name: 'Size 12 (SMP Standar)',
        quantity: 20,
        shipped_quantity: 20,
        unit_price: 65000,
        total_price: 1300000,
      },
      {
        id: 'oit_1_3',
        order_id: 'ord_1',
        product_id: 'prod_4',
        product_code: 'DSI-SD',
        product_name: 'Dasi Bordir SD Merah',
        size_code: null,
        size_name: 'N/A',
        quantity: 40,
        shipped_quantity: 40,
        unit_price: 15000,
        total_price: 600000,
      },

      // Items for ORD-2026-002 (PO SMP Harapan Bangsa)
      {
        id: 'oit_2_1',
        order_id: 'ord_2',
        product_id: 'prod_3',
        product_code: 'CLN-PRM',
        product_name: 'Celana Panjang Pramuka SMP/SMA',
        size_code: '28',
        size_name: 'Size 28',
        quantity: 50,
        shipped_quantity: 20, // 20 already shipped, 30 remaining!
        unit_price: 85000,
        total_price: 4250000,
      },
      {
        id: 'oit_2_2',
        order_id: 'ord_2',
        product_id: 'prod_3',
        product_code: 'CLN-PRM',
        product_name: 'Celana Panjang Pramuka SMP/SMA',
        size_code: '29',
        size_name: 'Size 29',
        quantity: 40,
        shipped_quantity: 20, // 20 already shipped, 20 remaining!
        unit_price: 85000,
        total_price: 3400000,
      },
      {
        id: 'oit_2_3',
        order_id: 'ord_2',
        product_id: 'prod_5',
        product_code: 'TPI-SD',
        product_name: 'Topi SD Merah Putih Bordir',
        size_code: null,
        size_name: 'N/A',
        quantity: 100,
        shipped_quantity: 0, // 0 shipped, 100 remaining!
        unit_price: 18000,
        total_price: 1800000,
      },

      // Items for ORD-2026-003
      {
        id: 'oit_3_1',
        order_id: 'ord_3',
        product_id: 'prod_1',
        product_code: 'KBT-TK',
        product_name: 'Kemeja Batik TK/SD',
        size_code: '2',
        size_name: 'Size 2 (Lingkar Dada 76cm)',
        quantity: 15,
        shipped_quantity: 0,
        unit_price: 75000,
        total_price: 1125000,
      },
      {
        id: 'oit_3_2',
        order_id: 'ord_3',
        product_id: 'prod_1',
        product_code: 'KBT-TK',
        product_name: 'Kemeja Batik TK/SD',
        size_code: '3',
        size_name: 'Size 3 (Lingkar Dada 80cm)',
        quantity: 15,
        shipped_quantity: 0,
        unit_price: 75000,
        total_price: 1125000,
      },
      {
        id: 'oit_3_3',
        order_id: 'ord_3',
        product_id: 'prod_4',
        product_code: 'DSI-SD',
        product_name: 'Dasi Bordir SD Merah',
        size_code: null,
        size_name: 'N/A',
        quantity: 20,
        shipped_quantity: 0,
        unit_price: 15000,
        total_price: 300000,
      },
    ],
    order_status_histories: [
      {
        id: 'osh_1_1',
        order_id: 'ord_1',
        status: 'REQUESTED',
        notes: 'Order diajukan oleh customer.',
        updated_by_name: 'SMP Harapan Bangsa',
        created_at: '2026-10-01T09:30:00Z',
      },
      {
        id: 'osh_1_2',
        order_id: 'ord_1',
        status: 'CONFIRMED',
        notes: 'Order dikonfirmasi oleh Owner. Pembayaran DP diterima.',
        updated_by_name: 'Pak Hendra (Owner)',
        created_at: '2026-10-01T14:00:00Z',
      },
      {
        id: 'osh_1_3',
        order_id: 'ord_1',
        status: 'PRODUCTION',
        notes: 'Pola dipotong dan proses jahit dimulai.',
        updated_by_name: 'Pak Hendra (Owner)',
        created_at: '2026-10-02T08:30:00Z',
      },
      {
        id: 'osh_1_4',
        order_id: 'ord_1',
        status: 'READY',
        notes: 'QC selesai, barang disortir dan dipacking rapi.',
        updated_by_name: 'Pak Hendra (Owner)',
        created_at: '2026-10-05T16:00:00Z',
      },
      {
        id: 'osh_1_5',
        order_id: 'ord_1',
        status: 'DELIVERING',
        notes: 'Dikirim dengan kurir operasional konveksi (Surat Jalan SJ-2026-001).',
        updated_by_name: 'Pak Hendra (Owner)',
        created_at: '2026-10-06T09:00:00Z',
      },
      {
        id: 'osh_1_6',
        order_id: 'ord_1',
        status: 'COMPLETED',
        notes: 'Diterima oleh Ibu Lina di SMP Harapan Bangsa. Transaksi lunas.',
        updated_by_name: 'Pak Hendra (Owner)',
        created_at: '2026-10-06T15:00:00Z',
      },

      // Status history for ORD-2026-002
      {
        id: 'osh_2_1',
        order_id: 'ord_2',
        status: 'REQUESTED',
        notes: 'Order diajukan.',
        updated_by_name: 'SMP Harapan Bangsa',
        created_at: '2026-10-05T11:15:00Z',
      },
      {
        id: 'osh_2_2',
        order_id: 'ord_2',
        status: 'CONFIRMED',
        notes: 'Dikonfirmasi, jadwal potong bahan disiapkan.',
        updated_by_name: 'Pak Hendra (Owner)',
        created_at: '2026-10-05T13:30:00Z',
      },
      {
        id: 'osh_2_3',
        order_id: 'ord_2',
        status: 'PARTIALLY_DELIVERED',
        notes: 'Pengiriman Bertahap Tahap 1 (Faktur/Surat Jalan SJ-2026-002): 20 pcs Celana Size 28 & 20 pcs Celana Size 29 telah dikirimkan ke sekolah.',
        updated_by_name: 'Pak Hendra (Owner)',
        created_at: '2026-10-07T10:00:00Z',
      },

      // Status history for ORD-2026-003
      {
        id: 'osh_3_1',
        order_id: 'ord_3',
        status: 'REQUESTED',
        notes: 'Order baru menunggu konfirmasi owner.',
        updated_by_name: 'SD Pertiwi 01',
        created_at: '2026-10-08T08:45:00Z',
      },
    ],
    deliveries: [
      {
        id: 'dlv_1',
        delivery_number: 'SJ-2026-001',
        order_id: 'ord_1',
        order_number: 'ORD-2026-001',
        customer_name: 'SMP Harapan Bangsa',
        delivery_date: '2026-10-06',
        delivery_method: 'Kurir Konveksi (Mobil Grand Max)',
        recipient_name: 'Ibu Lina (Kesiswaan)',
        phone: '081234567890',
        address: 'Jl. Merdeka No. 45, Jakarta Selatan',
        pic_name: 'Budi (Driver Konveksi)',
        status: 'DELIVERED',
        notes: 'Pengiriman lunas seluruh PO (80 pcs) dalam 2 kardus.',
        total_shipped_pcs: 80,
        total_delivery_amount: 3200000,
        items: [
          {
            order_item_id: 'oit_1_1',
            product_code: 'KPT-SMP',
            product_name: 'Kemeja Putih SMP Lengan Pendek',
            size_name: 'Size 11 (SMP Kelas 7 Sedang)',
            ordered_quantity: 20,
            previously_shipped: 0,
            quantity_shipped: 20,
            remaining_quantity: 0,
            unit_price: 65000,
            total_price: 1300000,
          },
          {
            order_item_id: 'oit_1_2',
            product_code: 'KPT-SMP',
            product_name: 'Kemeja Putih SMP Lengan Pendek',
            size_name: 'Size 12 (SMP Standar)',
            ordered_quantity: 20,
            previously_shipped: 0,
            quantity_shipped: 20,
            remaining_quantity: 0,
            unit_price: 65000,
            total_price: 1300000,
          },
          {
            order_item_id: 'oit_1_3',
            product_code: 'DSI-SD',
            product_name: 'Dasi Bordir SD Merah',
            size_name: 'N/A',
            ordered_quantity: 40,
            previously_shipped: 0,
            quantity_shipped: 40,
            remaining_quantity: 0,
            unit_price: 15000,
            total_price: 600000,
          },
        ],
        created_at: '2026-10-05T17:00:00Z',
        delivered_at: '2026-10-06T14:30:00Z',
      },
      {
        id: 'dlv_2',
        delivery_number: 'SJ-2026-002',
        order_id: 'ord_2',
        order_number: 'ORD-2026-002',
        customer_name: 'SMP Harapan Bangsa',
        delivery_date: '2026-10-07',
        delivery_method: 'Kurir Konveksi (Mobil Grand Max)',
        recipient_name: 'Ibu Lina (Kesiswaan)',
        phone: '081234567890',
        address: 'Jl. Merdeka No. 45, Jakarta Selatan',
        pic_name: 'Budi (Driver Konveksi)',
        status: 'DELIVERED',
        notes: 'Pengiriman Bertahap Tahap 1: 40 pcs celana dikirim terlebih dahulu untuk upacara.',
        total_shipped_pcs: 40,
        total_delivery_amount: 3400000,
        items: [
          {
            order_item_id: 'oit_2_1',
            product_code: 'CLN-PRM',
            product_name: 'Celana Panjang Pramuka SMP/SMA',
            size_name: 'Size 28',
            ordered_quantity: 50,
            previously_shipped: 0,
            quantity_shipped: 20,
            remaining_quantity: 30,
            unit_price: 85000,
            total_price: 1700000,
          },
          {
            order_item_id: 'oit_2_2',
            product_code: 'CLN-PRM',
            product_name: 'Celana Panjang Pramuka SMP/SMA',
            size_name: 'Size 29',
            ordered_quantity: 40,
            previously_shipped: 0,
            quantity_shipped: 20,
            remaining_quantity: 20,
            unit_price: 85000,
            total_price: 1700000,
          },
        ],
        created_at: '2026-10-07T09:00:00Z',
        delivered_at: '2026-10-07T14:00:00Z',
      },
    ],
    stock_items: [
      {
        id: 'stk_1',
        name: 'Kain Katun Batik Parang',
        sku: 'FAB-BTK-001',
        category: 'Bahan Baku',
        quantity: 120,
        unit: 'meter',
        min_stock: 30,
        location: 'Rak Bahan A1',
        cost_per_unit: 38000,
        active: true,
        created_at: '2026-10-01T08:00:00Z',
      },
      {
        id: 'stk_2',
        name: 'Kain TC Oxford Putih',
        sku: 'FAB-OXF-002',
        category: 'Bahan Baku',
        quantity: 18, // Below min_stock (35) -> LOW STOCK ALERT!
        unit: 'meter',
        min_stock: 35,
        location: 'Rak Bahan A2',
        cost_per_unit: 29000,
        active: true,
        created_at: '2026-10-01T08:00:00Z',
      },
      {
        id: 'stk_3',
        name: 'Kain Drill Coklat Pramuka',
        sku: 'FAB-DRL-003',
        category: 'Bahan Baku',
        quantity: 85,
        unit: 'meter',
        min_stock: 25,
        location: 'Rak Bahan B1',
        cost_per_unit: 42000,
        active: true,
        created_at: '2026-10-01T08:00:00Z',
      },
      {
        id: 'stk_4',
        name: 'Kancing Kemeja Putih 14mm',
        sku: 'ACC-KNC-001',
        category: 'Aksesoris',
        quantity: 14,
        unit: 'gross',
        min_stock: 5,
        location: 'Laci Aksesoris 02',
        cost_per_unit: 18000,
        active: true,
        created_at: '2026-10-01T08:00:00Z',
      },
      {
        id: 'stk_5',
        name: 'Benang Jahit Astra Putih',
        sku: 'ACC-BNG-001',
        category: 'Aksesoris',
        quantity: 6, // Below min_stock (10) -> LOW STOCK ALERT!
        unit: 'cones',
        min_stock: 10,
        location: 'Laci Aksesoris 01',
        cost_per_unit: 16500,
        active: true,
        created_at: '2026-10-01T08:00:00Z',
      },
      {
        id: 'stk_6',
        name: 'Plastik Kemasan Baju 30x40',
        sku: 'PCK-PLS-001',
        category: 'Packaging',
        quantity: 350,
        unit: 'pcs',
        min_stock: 100,
        location: 'Gudang Packing C',
        cost_per_unit: 450,
        active: true,
        created_at: '2026-10-01T08:00:00Z',
      },
    ],
    stock_movements: [
      {
        id: 'smv_1',
        stock_item_id: 'stk_1',
        stock_item_name: 'Kain Katun Batik Parang',
        type: 'PURCHASE',
        quantity_change: 150,
        previous_quantity: 0,
        new_quantity: 150,
        notes: 'Pembelian gulungan kain dari Toko Tekstil Jaya',
        reference_order_id: null,
        created_by: 'Pak Hendra (Owner)',
        created_at: '2026-10-01T11:00:00Z',
      },
      {
        id: 'smv_2',
        stock_item_id: 'stk_1',
        stock_item_name: 'Kain Katun Batik Parang',
        type: 'PRODUCTION_USAGE',
        quantity_change: -30,
        previous_quantity: 150,
        new_quantity: 120,
        notes: 'Pemakaian potong seragam batik',
        reference_order_id: 'ord_1',
        created_by: 'Pak Hendra (Owner)',
        created_at: '2026-10-03T09:00:00Z',
      },
      {
        id: 'smv_3',
        stock_item_id: 'stk_2',
        stock_item_name: 'Kain TC Oxford Putih',
        type: 'PRODUCTION_USAGE',
        quantity_change: -42,
        previous_quantity: 60,
        new_quantity: 18,
        notes: 'Pemakaian produksi kemeja putih SMP',
        reference_order_id: 'ord_1',
        created_by: 'Pak Hendra (Owner)',
        created_at: '2026-10-03T14:00:00Z',
      },
    ],
    expenses: [
      {
        id: 'exp_1',
        date: '2026-10-01',
        category: 'Bahan Baku',
        title: 'Pembelian Kain Katun Batik 150 meter',
        vendor_or_payee: 'Toko Tekstil Jaya Abadi',
        amount: 5700000,
        notes: 'Pembayaran transfer bank BCA faktur #TJ-8921',
        created_at: '2026-10-01T11:15:00Z',
      },
      {
        id: 'exp_2',
        date: '2026-10-02',
        category: 'Bahan Baku',
        title: 'Pembelian Kain TC Oxford 60 meter + Kancing & Benang',
        vendor_or_payee: 'CV Berkat Busana',
        amount: 2150000,
        notes: 'Kebutuhan seragam SMP Harapan Bangsa',
        created_at: '2026-10-02T10:00:00Z',
      },
      {
        id: 'exp_3',
        date: '2026-10-03',
        category: 'Listrik',
        title: 'Token Listrik Workshop Konveksi (9000 VA)',
        vendor_or_payee: 'PLN Persero',
        amount: 750000,
        notes: 'Operasional mesin jahit industri & setrika uap',
        created_at: '2026-10-03T08:30:00Z',
      },
      {
        id: 'exp_4',
        date: '2026-10-04',
        category: 'Packaging',
        title: 'Beli Plastik Sablon + Kardus Packing 50 pcs',
        vendor_or_payee: 'Plastindo Pack',
        amount: 320000,
        notes: 'Kemasan seragam siap kirim',
        created_at: '2026-10-04T13:00:00Z',
      },
      {
        id: 'exp_5',
        date: '2026-10-06',
        category: 'Transport',
        title: 'Bensin & Tol Pengiriman Mobil Toko',
        vendor_or_payee: 'SPBU Pertamina Fatmawati',
        amount: 150000,
        notes: 'Pengiriman ORD-2026-001 ke Jakarta Selatan',
        created_at: '2026-10-06T10:00:00Z',
      },
    ],
    employees: [
      {
        id: 'emp_1',
        employee_code: 'EMP-001',
        name: 'Budi Santoso',
        phone: '081223344556',
        position: 'Penjahit Utama',
        salary_type: 'PIECE_RATE',
        base_rate: 0,
        join_date: '2024-03-01',
        active: true,
      },
      {
        id: 'emp_2',
        employee_code: 'EMP-002',
        name: 'Siti Rahmawati',
        phone: '081334455667',
        position: 'Pemotong Pola',
        salary_type: 'PIECE_RATE',
        base_rate: 0,
        join_date: '2024-05-15',
        active: true,
      },
      {
        id: 'emp_3',
        employee_code: 'EMP-003',
        name: 'Agus Priyanto',
        phone: '085712347890',
        position: 'Finishing & QC',
        salary_type: 'DAILY',
        base_rate: 125000,
        join_date: '2025-01-10',
        active: true,
      },
      {
        id: 'emp_4',
        employee_code: 'EMP-004',
        name: 'Dewi Lestari',
        phone: '081987654321',
        position: 'Packing & Label',
        salary_type: 'DAILY',
        base_rate: 100000,
        join_date: '2025-02-01',
        active: true,
      },
    ],
    payrolls: [
      {
        id: 'prl_1',
        employee_id: 'emp_1',
        employee_name: 'Budi Santoso',
        position: 'Penjahit Utama',
        period: 'September 2026',
        base_salary: 3200000,
        overtime: 350000,
        bonus: 200000,
        deduction: 50000,
        total_salary: 3700000,
        status: 'PAID',
        payment_date: '2026-09-30',
        notes: 'Gaji periode September lunas via transfer BCA',
        created_at: '2026-09-28T10:00:00Z',
      },
      {
        id: 'prl_2',
        employee_id: 'emp_2',
        employee_name: 'Siti Rahmawati',
        position: 'Pemotong Pola',
        period: 'September 2026',
        base_salary: 2900000,
        overtime: 200000,
        bonus: 150000,
        deduction: 0,
        total_salary: 3250000,
        status: 'PAID',
        payment_date: '2026-09-30',
        notes: 'Gaji periode September lunas via transfer Mandiri',
        created_at: '2026-09-28T10:00:00Z',
      },
      {
        id: 'prl_3',
        employee_id: 'emp_1',
        employee_name: 'Budi Santoso',
        position: 'Penjahit Utama',
        period: 'Oktober 2026',
        base_salary: 3200000,
        overtime: 400000,
        bonus: 250000,
        deduction: 0,
        total_salary: 3850000,
        status: 'CALCULATED',
        payment_date: null,
        notes: 'Draft perhitungan gaji Oktober (menunggu tanggal 30)',
        created_at: '2026-10-07T14:00:00Z',
      },
    ],
  };
}

class Database {
  constructor() {
    this.data = null;
    this.init();
  }

  init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
      this.data = getInitialData();
      this.save();
    } else {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } catch (err) {
        console.error('Error reading db.json, reinitializing seeds:', err);
        this.data = getInitialData();
        this.save();
      }
    }
  }

  save() {
    try {
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Failed to save DB:', err);
    }
  }

  get(table) {
    return this.data[table] || [];
  }

  find(table, predicate) {
    return (this.data[table] || []).find(predicate);
  }

  filter(table, predicate) {
    return (this.data[table] || []).filter(predicate);
  }

  insert(table, item) {
    if (!this.data[table]) {
      this.data[table] = [];
    }
    this.data[table].push(item);
    this.save();
    return item;
  }

  update(table, id, updates) {
    const list = this.data[table] || [];
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) return null;
    list[index] = { ...list[index], ...updates };
    this.save();
    return list[index];
  }

  delete(table, id) {
    const list = this.data[table] || [];
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) return false;
    list.splice(index, 1);
    this.save();
    return true;
  }

  reset() {
    this.data = getInitialData();
    this.save();
    return this.data;
  }
}

export const db = new Database();
