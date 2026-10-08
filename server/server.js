import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { db } from './db.js';

// Auto-reloaded with variant pricing & human status support
const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Helper to generate IDs
const generateId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

// -----------------------------------------------------------------------------
// AUTH & USERS
// -----------------------------------------------------------------------------
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password wajib diisi' });
  }

  const cleanIdentifier = username.trim().toLowerCase();
  const cleanPassword = password.trim();

  // Cari user berdasarkan username ATAU email
  const user = db.find(
    'users',
    (u) =>
      u.username.toLowerCase() === cleanIdentifier ||
      (u.email && u.email.toLowerCase() === cleanIdentifier)
  );

  if (!user) {
    return res.status(401).json({ error: 'Username atau password salah' });
  }

  // Verifikasi password (bcrypt hash atau fallback plain text)
  let isPasswordValid = false;
  const isBcrypt = /^\$2[aby]\$\d{2}\$/.test(user.password);

  if (isBcrypt) {
    isPasswordValid = await bcrypt.compare(cleanPassword, user.password);
  } else {
    isPasswordValid = user.password === cleanPassword;
    // Auto upgrade password plain ke bcrypt hash
    if (isPasswordValid) {
      try {
        const hashed = await bcrypt.hash(cleanPassword, 10);
        db.update('users', user.id, { password: hashed });
      } catch (err) {
        console.warn('Auto-hash password upgrade error:', err);
      }
    }
  }

  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Username atau password salah' });
  }

  if (!user.active) {
    return res.status(403).json({ error: 'Akun Anda sedang dinonaktifkan oleh administrator' });
  }

  // Find linked customer info if CUSTOMER role
  let customerInfo = null;
  if (user.role === 'CUSTOMER' && user.customer_id) {
    customerInfo = db.find('customers', (c) => c.id === user.customer_id);
  }

  const { password: _, ...safeUser } = user;
  res.json({
    user: safeUser,
    customer: customerInfo,
    must_change_password: Boolean(user.must_change_password),
  });
});

app.post('/api/auth/change-password', async (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;
  if (!userId || !oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Password lama dan password baru wajib diisi' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password baru minimal 6 karakter' });
  }

  const user = db.find('users', (u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User tidak ditemukan' });
  }

  // SELALU verifikasi kecocokan password lama
  const isBcrypt = /^\$2[aby]\$\d{2}\$/.test(user.password);
  const isOldValid = isBcrypt
    ? await bcrypt.compare(oldPassword.trim(), user.password)
    : user.password === oldPassword.trim();

  if (!isOldValid) {
    return res.status(400).json({ error: 'Password lama tidak sesuai. Silakan masukkan password saat ini yang benar.' });
  }

  // Enkripsi password baru dengan bcrypt
  const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);

  const updated = db.update('users', userId, {
    password: hashedPassword,
    must_change_password: false,
    updated_at: new Date().toISOString(),
  });

  const { password: _, ...safeUser } = updated;
  res.json({ message: 'Password berhasil diperbarui', user: safeUser });
});

app.get('/api/users', (req, res) => {
  const users = db.get('users').map(({ password, ...u }) => u);
  res.json(users);
});

app.post('/api/users', async (req, res) => {
  const { username, email, name, role, customer_id } = req.body;
  if (!username || !email || !name || !role) {
    return res.status(400).json({ error: 'Data user wajib diisi lengkap' });
  }

  const cleanUsername = username.trim().toLowerCase();
  const cleanEmail = email.trim().toLowerCase();

  const existing = db.find(
    'users',
    (u) =>
      u.username.toLowerCase() === cleanUsername ||
      u.email.toLowerCase() === cleanEmail
  );
  if (existing) {
    return res.status(400).json({ error: 'Username atau Email sudah terdaftar' });
  }

  // Generate initial password dan enkripsi dengan bcrypt
  const initialPassword = 'User' + Math.floor(1000 + Math.random() * 9000);
  const hashedPassword = await bcrypt.hash(initialPassword, 10);

  const newUser = {
    id: generateId('usr'),
    username: cleanUsername,
    email: cleanEmail,
    password: hashedPassword,
    name: name.trim(),
    role,
    customer_id: role === 'CUSTOMER' ? customer_id : null,
    must_change_password: true,
    active: true,
    created_at: new Date().toISOString(),
  };

  db.insert('users', newUser);
  const { password: _, ...safeUser } = newUser;
  res.status(201).json({
    user: safeUser,
    generatedPassword: initialPassword,
    message: `User berhasil dibuat dengan initial password: ${initialPassword}`,
  });
});

app.put('/api/users/:id/reset-password', async (req, res) => {
  const { id } = req.params;
  const user = db.find('users', (u) => u.id === id);
  if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

  const tempPassword = 'Reset' + Math.floor(1000 + Math.random() * 9000);
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  db.update('users', id, {
    password: hashedPassword,
    must_change_password: true,
  });

  res.json({
    message: 'Password berhasil di-reset',
    temporaryPassword: tempPassword,
  });
});

app.put('/api/users/:id/set-password', async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Password baru minimal 6 karakter' });
  }

  const user = db.find('users', (u) => u.id === id);
  if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

  const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);

  db.update('users', id, {
    password: hashedPassword,
    must_change_password: false,
    updated_at: new Date().toISOString(),
  });

  res.json({ message: 'Password berhasil diubah secara manual' });
});

app.put('/api/users/:id/toggle-active', (req, res) => {
  const { id } = req.params;
  const user = db.find('users', (u) => u.id === id);
  if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

  const updated = db.update('users', id, { active: !user.active });
  res.json(updated);
});

// -----------------------------------------------------------------------------
// CUSTOMERS
// -----------------------------------------------------------------------------
app.get('/api/customers', (req, res) => {
  res.json(db.get('customers'));
});

app.post('/api/customers', (req, res) => {
  const { name, pic, phone, email, address } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'Nama instansi dan no telp wajib diisi' });

  const customers = db.get('customers');
  const code = `CST-${String(customers.length + 1).padStart(3, '0')}`;
  const newCustomer = {
    id: generateId('cust'),
    code,
    name,
    pic: pic || '-',
    phone,
    email: email || '',
    address: address || '',
    created_at: new Date().toISOString(),
  };

  db.insert('customers', newCustomer);
  res.status(201).json(newCustomer);
});

// -----------------------------------------------------------------------------
// PRODUCTS & SIZES
// -----------------------------------------------------------------------------
app.get('/api/products', (req, res) => {
  const activeOnly = req.query.activeOnly === 'true';
  let products = db.get('products');
  if (activeOnly) {
    products = products.filter((p) => p.active);
  }

  const allSizes = db.get('product_sizes');
  const result = products.map((prod) => ({
    ...prod,
    wage_per_piece: prod.wage_per_piece !== undefined ? Number(prod.wage_per_piece) : 10000,
    sizes: allSizes
      .filter((s) => s.product_id === prod.id && s.active)
      .map((s) => ({
        ...s,
        price: s.price !== undefined && s.price !== null ? Number(s.price) : Number(prod.price),
      }))
      .sort((a, b) => a.sort_order - b.sort_order),
  }));

  res.json(result);
});

app.post('/api/products', (req, res) => {
  const { code, name, description, category, has_size, price, wage_per_piece, sizes } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Nama produk dan harga wajib diisi' });
  }

  const newProdId = generateId('prod');
  const generatedCode = code || `PRD-${Date.now().toString().slice(-4)}`;

  const newProduct = {
    id: newProdId,
    code: generatedCode,
    name,
    description: description || '',
    category: category || 'Umum',
    has_size: Boolean(has_size),
    price: Number(price),
    wage_per_piece: wage_per_piece !== undefined ? Number(wage_per_piece) : 10000,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.insert('products', newProduct);

  // If has_size is true, insert sizes
  const createdSizes = [];
  if (has_size && Array.isArray(sizes) && sizes.length > 0) {
    sizes.forEach((s, idx) => {
      const sizePrice = s.price !== undefined && s.price !== null && s.price !== '' ? Number(s.price) : Number(price);
      const sizeObj = {
        id: generateId('psz'),
        product_id: newProdId,
        size_code: s.size_code || String(s),
        size_name: s.size_name || `Size ${s.size_code || s}`,
        price: sizePrice,
        sort_order: idx + 1,
        active: true,
      };
      db.insert('product_sizes', sizeObj);
      createdSizes.push(sizeObj);
    });
  }

  res.status(201).json({ ...newProduct, sizes: createdSizes });
});

app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const { code, name, description, category, has_size, price, wage_per_piece, active, sizes } = req.body;

  const product = db.find('products', (p) => p.id === id);
  if (!product) return res.status(404).json({ error: 'Produk tidak ditemukan' });

  const updatedProduct = db.update('products', id, {
    ...(code !== undefined && { code }),
    ...(name !== undefined && { name }),
    ...(description !== undefined && { description }),
    ...(category !== undefined && { category }),
    ...(has_size !== undefined && { has_size: Boolean(has_size) }),
    ...(price !== undefined && { price: Number(price) }),
    ...(wage_per_piece !== undefined && { wage_per_piece: Number(wage_per_piece) }),
    ...(active !== undefined && { active: Boolean(active) }),
    updated_at: new Date().toISOString(),
  });

  // If sizes are provided, update sizes list
  if (has_size && Array.isArray(sizes)) {
    // Deactivate old sizes
    const existingSizes = db.filter('product_sizes', (s) => s.product_id === id);
    existingSizes.forEach((s) => db.delete('product_sizes', s.id));

    const baseProductPrice = price !== undefined ? Number(price) : Number(product.price);
    sizes.forEach((s, idx) => {
      const sizePrice = s.price !== undefined && s.price !== null && s.price !== '' ? Number(s.price) : baseProductPrice;
      db.insert('product_sizes', {
        id: generateId('psz'),
        product_id: id,
        size_code: s.size_code || String(s),
        size_name: s.size_name || `Size ${s.size_code || s}`,
        price: sizePrice,
        sort_order: idx + 1,
        active: true,
      });
    });
  }

  const updatedSizes = db.filter('product_sizes', (s) => s.product_id === id && s.active);
  res.json({ ...updatedProduct, sizes: updatedSizes });
});

// Soft delete
app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const updated = db.update('products', id, { active: false, updated_at: new Date().toISOString() });
  if (!updated) return res.status(404).json({ error: 'Produk tidak ditemukan' });
  res.json({ message: 'Produk berhasil dinonaktifkan (soft delete)', product: updated });
});

// -----------------------------------------------------------------------------
// ORDERS & SNAPSHOTS (MASTER PLAN CORE REQUIREMENT)
// -----------------------------------------------------------------------------
app.get('/api/orders', (req, res) => {
  const { customer_id, status } = req.query;
  let orders = db.get('orders');

  if (customer_id) {
    orders = orders.filter((o) => o.customer_id === customer_id);
  }

  if (status) {
    orders = orders.filter((o) => o.status === status);
  }

  // Sort newest first
  orders = [...orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const allItems = db.get('order_items');
  const allDeliveries = db.get('deliveries');

  const populated = orders.map((ord) => {
    const items = allItems
      .filter((it) => it.order_id === ord.id)
      .map((it) => {
        const shipped = Number(it.shipped_quantity || 0);
        const qty = Number(it.quantity);
        return {
          ...it,
          shipped_quantity: shipped,
          remaining_quantity: Math.max(0, qty - shipped),
        };
      });

    const deliveries = allDeliveries
      .filter((d) => d.order_id === ord.id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const totalOrderedPcs = items.reduce((sum, it) => sum + it.quantity, 0);
    const totalShippedPcs = items.reduce((sum, it) => sum + it.shipped_quantity, 0);
    const totalRemainingPcs = Math.max(0, totalOrderedPcs - totalShippedPcs);

    return {
      ...ord,
      items,
      deliveries,
      delivery: deliveries[0] || null, // latest delivery
      total_ordered_pcs: totalOrderedPcs,
      total_shipped_pcs: totalShippedPcs,
      total_remaining_pcs: totalRemainingPcs,
      is_partially_delivered: totalShippedPcs > 0 && totalRemainingPcs > 0,
      is_fully_shipped: totalRemainingPcs === 0 && totalOrderedPcs > 0,
    };
  });

  res.json(populated);
});

app.get('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const order = db.find('orders', (o) => o.id === id);
  if (!order) return res.status(404).json({ error: 'Order tidak ditemukan' });

  const rawItems = db.filter('order_items', (it) => it.order_id === id);
  const items = rawItems.map((it) => {
    const shipped = Number(it.shipped_quantity || 0);
    const qty = Number(it.quantity);
    return {
      ...it,
      shipped_quantity: shipped,
      remaining_quantity: Math.max(0, qty - shipped),
    };
  });

  const histories = db.filter('order_status_histories', (h) => h.order_id === id).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const deliveries = db.filter('deliveries', (d) => d.order_id === id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const totalOrderedPcs = items.reduce((sum, it) => sum + it.quantity, 0);
  const totalShippedPcs = items.reduce((sum, it) => sum + it.shipped_quantity, 0);
  const totalRemainingPcs = Math.max(0, totalOrderedPcs - totalShippedPcs);

  res.json({
    ...order,
    items,
    histories,
    deliveries,
    delivery: deliveries[0] || null,
    total_ordered_pcs: totalOrderedPcs,
    total_shipped_pcs: totalShippedPcs,
    total_remaining_pcs: totalRemainingPcs,
    is_partially_delivered: totalShippedPcs > 0 && totalRemainingPcs > 0,
    is_fully_shipped: totalRemainingPcs === 0 && totalOrderedPcs > 0,
  });
});

app.post('/api/orders', (req, res) => {
  const { customer_id, items, customer_message, created_by } = req.body;

  if (!customer_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Customer dan minimal satu item order wajib diisi' });
  }

  const customer = db.find('customers', (c) => c.id === customer_id);
  if (!customer) {
    return res.status(404).json({ error: 'Customer tidak ditemukan' });
  }

  // VALIDATION 1: Duplicate Product + Size Rule (Master plan section 14 & 45)
  const seenCombos = new Set();
  for (const it of items) {
    const pId = it.product_id || it.productId;
    const sCode = it.size_code || it.sizeCode || 'NOSIZE';
    const comboKey = `${pId}__${sCode}`;

    if (seenCombos.has(comboKey)) {
      return res.status(400).json({
        error: `Validasi gagal: Kombinasi produk dan ukuran duplicate ditemukan. Produk dan ukuran yang sama tidak boleh dimasukkan lebih dari sekali dalam satu pesanan.`,
      });
    }
    seenCombos.add(comboKey);

    if (!it.quantity || Number(it.quantity) <= 0) {
      return res.status(400).json({ error: 'Jumlah / Quantity harus lebih besar dari 0' });
    }
  }

  // BUILD IMMUTABLE SNAPSHOT (Master plan section 17, 18, 43, 44)
  const allProducts = db.get('products');
  const allSizes = db.get('product_sizes');
  const orderItemsSnapshot = [];
  let totalOrderAmount = 0;

  const newOrderId = generateId('ord');

  for (const item of items) {
    const targetProdId = item.product_id || item.productId;
    const targetSizeCode = item.size_code || item.sizeCode;

    const product = allProducts.find((p) => p.id === targetProdId);
    if (!product || !product.active) {
      return res.status(400).json({ error: `Produk ID ${targetProdId} tidak aktif atau tidak ditemukan` });
    }

    // Size validation
    let sizeName = 'N/A';
    let sizeCode = null;

    if (product.has_size) {
      if (!targetSizeCode) {
        return res.status(400).json({ error: `Produk '${product.name}' wajib memilih ukuran` });
      }
      const sizeObj = allSizes.find((s) => s.product_id === product.id && s.size_code === String(targetSizeCode) && s.active);
      if (!sizeObj) {
        return res.status(400).json({ error: `Ukuran '${targetSizeCode}' tidak valid untuk produk '${product.name}'` });
      }
      sizeCode = sizeObj.size_code;
      sizeName = sizeObj.size_name;
    } else {
      sizeCode = null;
      sizeName = 'N/A';
    }

    const qty = Number(item.quantity);
    let unitPrice = Number(product.price);
    if (product.has_size && sizeCode) {
      const sizeObj = allSizes.find((s) => s.product_id === product.id && s.size_code === String(targetSizeCode) && s.active);
      if (sizeObj && sizeObj.price !== undefined && sizeObj.price !== null && Number(sizeObj.price) > 0) {
        unitPrice = Number(sizeObj.price);
      }
    }
    const totalPrice = qty * unitPrice;
    totalOrderAmount += totalPrice;

    orderItemsSnapshot.push({
      id: generateId('oit'),
      order_id: newOrderId,
      product_id: product.id,
      product_code: product.code,
      product_name: product.name,
      size_code: sizeCode,
      size_name: sizeName,
      quantity: qty,
      unit_price: unitPrice,
      total_price: totalPrice,
    });
  }

  // Generate order number
  const orderCount = db.get('orders').length + 1;
  const currentYear = new Date().getFullYear();
  const orderNumber = `ORD-${currentYear}-${String(orderCount).padStart(3, '0')}`;

  const newOrder = {
    id: newOrderId,
    order_number: orderNumber,
    customer_id: customer.id,
    customer_name: customer.name,
    customer_phone: customer.phone,
    customer_address: customer.address,
    status: 'REQUESTED',
    total_amount: totalOrderAmount,
    customer_message: customer_message || '',
    created_by: created_by || 'Customer',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.insert('orders', newOrder);

  // Insert snapshots
  orderItemsSnapshot.forEach((oit) => db.insert('order_items', oit));

  // Insert initial status history
  const initialHistory = {
    id: generateId('osh'),
    order_id: newOrderId,
    status: 'REQUESTED',
    notes: 'Pesanan diajukan oleh customer.',
    updated_by_name: customer.name,
    created_at: new Date().toISOString(),
  };
  db.insert('order_status_histories', initialHistory);

  res.status(201).json({
    message: 'Pesanan berhasil dibuat!',
    order: {
      ...newOrder,
      items: orderItemsSnapshot,
      histories: [initialHistory],
    },
  });
});

app.put('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, notes, updated_by_name } = req.body;

  const validStatuses = ['REQUESTED', 'CONFIRMED', 'REJECTED', 'PRODUCTION', 'READY', 'DELIVERING', 'COMPLETED', 'CANCELLED'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status tidak valid. Pilihan: ${validStatuses.join(', ')}` });
  }

  const order = db.find('orders', (o) => o.id === id);
  if (!order) return res.status(404).json({ error: 'Order tidak ditemukan' });

  const updatedOrder = db.update('orders', id, {
    status,
    updated_at: new Date().toISOString(),
  });

  // Record history
  const historyEntry = {
    id: generateId('osh'),
    order_id: id,
    status,
    notes: notes || `Status diubah menjadi ${status}`,
    updated_by_name: updated_by_name || 'Owner',
    created_at: new Date().toISOString(),
  };
  db.insert('order_status_histories', historyEntry);

  // Auto create or update delivery if transitioning to READY or DELIVERING or COMPLETED
  let delivery = db.find('deliveries', (d) => d.order_id === id);
  if (status === 'READY' && !delivery) {
    delivery = {
      id: generateId('dlv'),
      order_id: id,
      order_number: order.order_number,
      customer_name: order.customer_name,
      delivery_date: new Date().toISOString().split('T')[0],
      delivery_method: 'Kurir Konveksi',
      recipient_name: order.customer_name,
      phone: order.customer_phone || '',
      address: order.customer_address || '',
      pic_name: 'Driver Konveksi',
      status: 'READY',
      notes: 'Siap dikirim',
      created_at: new Date().toISOString(),
      delivered_at: null,
    };
    db.insert('deliveries', delivery);
  } else if (status === 'DELIVERING' && delivery) {
    db.update('deliveries', delivery.id, { status: 'DELIVERING' });
  } else if (status === 'COMPLETED' && delivery) {
    db.update('deliveries', delivery.id, {
      status: 'DELIVERED',
      delivered_at: new Date().toISOString(),
    });
  }

  res.json({
    message: `Status order berhasil diperbarui ke ${status}`,
    order: updatedOrder,
    history: historyEntry,
  });
});

// -----------------------------------------------------------------------------
// INVENTORY & STOCK MOVEMENTS
// -----------------------------------------------------------------------------
app.get('/api/inventory', (req, res) => {
  const items = db.get('stock_items').map((it) => ({
    ...it,
    is_low_stock: it.quantity <= it.min_stock,
  }));
  res.json(items);
});

app.post('/api/inventory', (req, res) => {
  const { name, sku, category, quantity, unit, min_stock, location, cost_per_unit } = req.body;
  if (!name || quantity === undefined || !unit) {
    return res.status(400).json({ error: 'Nama, jumlah stok, dan satuan unit wajib diisi' });
  }

  const generatedSku = sku || `STK-${Date.now().toString().slice(-4)}`;
  const newItem = {
    id: generateId('stk'),
    name,
    sku: generatedSku,
    category: category || 'Bahan Baku',
    quantity: Number(quantity),
    unit,
    min_stock: Number(min_stock) || 0,
    location: location || 'Gudang Utama',
    cost_per_unit: Number(cost_per_unit) || 0,
    active: true,
    created_at: new Date().toISOString(),
  };

  db.insert('stock_items', newItem);
  res.status(201).json(newItem);
});

app.post('/api/inventory/movement', (req, res) => {
  const { stock_item_id, type, quantity_change, notes, reference_order_id, created_by, record_expense, supplier_name } = req.body;

  const validTypes = ['PURCHASE', 'PRODUCTION_USAGE', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'RETURN', 'OTHER'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: 'Tipe movement stok tidak valid' });
  }

  const stockItem = db.find('stock_items', (s) => s.id === stock_item_id);
  if (!stockItem) {
    return res.status(404).json({ error: 'Barang stok tidak ditemukan' });
  }

  const delta = Number(quantity_change);
  const prevQty = stockItem.quantity;
  const newQty = Math.max(0, prevQty + delta);

  db.update('stock_items', stock_item_id, { quantity: newQty });

  const movement = {
    id: generateId('smv'),
    stock_item_id,
    stock_item_name: stockItem.name,
    type,
    quantity_change: delta,
    previous_quantity: prevQty,
    new_quantity: newQty,
    notes: notes || '',
    reference_order_id: reference_order_id || null,
    created_by: created_by || 'Owner',
    created_at: new Date().toISOString(),
  };
  db.insert('stock_movements', movement);

  // If purchase and user checked "catat ke pengeluaran/expense"
  if (type === 'PURCHASE' && record_expense && stockItem.cost_per_unit) {
    const expenseTotal = Math.abs(delta) * stockItem.cost_per_unit;
    db.insert('expenses', {
      id: generateId('exp'),
      date: new Date().toISOString().split('T')[0],
      category: 'Bahan Baku',
      title: `Beli ${stockItem.name} (${Math.abs(delta)} ${stockItem.unit})`,
      vendor_or_payee: supplier_name || 'Supplier Bahan',
      amount: expenseTotal,
      notes: notes || 'Otomatis dicatat dari transaksi stok masuk',
      created_at: new Date().toISOString(),
    });
  }

  res.json({
    message: 'Perubahan stok berhasil dicatat',
    stockItem: { ...stockItem, quantity: newQty },
    movement,
  });
});

app.get('/api/inventory/movements', (req, res) => {
  const { stock_item_id } = req.query;
  let movements = db.get('stock_movements');
  if (stock_item_id) {
    movements = movements.filter((m) => m.stock_item_id === stock_item_id);
  }
  movements = [...movements].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(movements);
});

// -----------------------------------------------------------------------------
// DELIVERIES
// -----------------------------------------------------------------------------
app.get('/api/deliveries', (req, res) => {
  const deliveries = [...db.get('deliveries')].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(deliveries);
});

app.get('/api/deliveries/:id', (req, res) => {
  const { id } = req.params;
  const delivery = db.find('deliveries', (d) => d.id === id || d.delivery_number === id);
  if (!delivery) return res.status(404).json({ error: 'Faktur pengiriman tidak ditemukan' });
  res.json(delivery);
});

app.post('/api/deliveries', (req, res) => {
  const {
    order_id,
    delivery_date,
    delivery_method,
    recipient_name,
    phone,
    address,
    pic_name,
    notes,
    items, // array of { order_item_id, quantity_shipped }
    created_by,
  } = req.body;

  const order = db.find('orders', (o) => o.id === order_id);
  if (!order) return res.status(404).json({ error: 'Order tidak ditemukan' });

  const allOrderItems = db.filter('order_items', (it) => it.order_id === order_id);
  if (allOrderItems.length === 0) {
    return res.status(400).json({ error: 'Order tidak memiliki item produk' });
  }

  // Validate shipped items
  const deliveryItemsSnapshot = [];
  let totalShippedPcs = 0;
  let totalDeliveryAmount = 0;

  if (Array.isArray(items) && items.length > 0) {
    for (const shipReq of items) {
      const orderItem = allOrderItems.find((it) => it.id === shipReq.order_item_id);
      if (!orderItem) continue;

      const qtyToShip = Number(shipReq.quantity_shipped || 0);
      if (qtyToShip <= 0) continue;

      const currentShipped = Number(orderItem.shipped_quantity || 0);
      const remaining = Math.max(0, Number(orderItem.quantity) - currentShipped);

      if (qtyToShip > remaining) {
        return res.status(400).json({
          error: `Jumlah kirim untuk '${orderItem.product_name}' (${qtyToShip} pcs) melebihi sisa pesanan (${remaining} pcs).`,
        });
      }

      const itemDeliveryTotal = qtyToShip * Number(orderItem.unit_price);
      totalShippedPcs += qtyToShip;
      totalDeliveryAmount += itemDeliveryTotal;

      deliveryItemsSnapshot.push({
        order_item_id: orderItem.id,
        product_code: orderItem.product_code,
        product_name: orderItem.product_name,
        size_code: orderItem.size_code,
        size_name: orderItem.size_name,
        ordered_quantity: Number(orderItem.quantity),
        previously_shipped: currentShipped,
        quantity_shipped: qtyToShip,
        remaining_quantity: remaining - qtyToShip,
        unit_price: Number(orderItem.unit_price),
        total_price: itemDeliveryTotal,
      });

      // Update shipped_quantity on order_item
      db.update('order_items', orderItem.id, {
        shipped_quantity: currentShipped + qtyToShip,
      });
    }
  } else {
    // Ship all remaining items
    for (const orderItem of allOrderItems) {
      const currentShipped = Number(orderItem.shipped_quantity || 0);
      const remaining = Math.max(0, Number(orderItem.quantity) - currentShipped);
      if (remaining <= 0) continue;

      const itemDeliveryTotal = remaining * Number(orderItem.unit_price);
      totalShippedPcs += remaining;
      totalDeliveryAmount += itemDeliveryTotal;

      deliveryItemsSnapshot.push({
        order_item_id: orderItem.id,
        product_code: orderItem.product_code,
        product_name: orderItem.product_name,
        size_code: orderItem.size_code,
        size_name: orderItem.size_name,
        ordered_quantity: Number(orderItem.quantity),
        previously_shipped: currentShipped,
        quantity_shipped: remaining,
        remaining_quantity: 0,
        unit_price: Number(orderItem.unit_price),
        total_price: itemDeliveryTotal,
      });

      db.update('order_items', orderItem.id, {
        shipped_quantity: currentShipped + remaining,
      });
    }
  }

  if (deliveryItemsSnapshot.length === 0 || totalShippedPcs === 0) {
    return res.status(400).json({ error: 'Tidak ada kuantitas barang yang dikirim (> 0 pcs)' });
  }

  // Generate delivery number
  const deliveryCount = db.get('deliveries').length + 1;
  const currentYear = new Date().getFullYear();
  const deliveryNumber = `SJ-${currentYear}-${String(deliveryCount).padStart(3, '0')}`;

  const newDelivery = {
    id: generateId('dlv'),
    delivery_number: deliveryNumber,
    order_id: order.id,
    order_number: order.order_number,
    customer_name: order.customer_name,
    delivery_date: delivery_date || new Date().toISOString().split('T')[0],
    delivery_method: delivery_method || 'Kurir Konveksi',
    recipient_name: recipient_name || order.customer_name,
    phone: phone || order.customer_phone || '',
    address: address || order.customer_address || '',
    pic_name: pic_name || 'Driver Konveksi',
    status: 'DELIVERING',
    notes: notes || '',
    total_shipped_pcs: totalShippedPcs,
    total_delivery_amount: totalDeliveryAmount,
    items: deliveryItemsSnapshot,
    created_at: new Date().toISOString(),
    delivered_at: null,
  };

  db.insert('deliveries', newDelivery);

  // Check if entire PO is completely fulfilled
  const refreshedItems = db.filter('order_items', (it) => it.order_id === order_id);
  const isAllShipped = refreshedItems.every((it) => (it.shipped_quantity || 0) >= it.quantity);
  const nextStatus = isAllShipped ? 'COMPLETED' : 'PARTIALLY_DELIVERED';

  const updatedOrder = db.update('orders', order.id, {
    status: nextStatus,
    updated_at: new Date().toISOString(),
  });

  const historyNote = isAllShipped
    ? `Pengiriman Terakhir (${deliveryNumber}): ${totalShippedPcs} pcs dikirim. Seluruh pesanan telah lengkap terkirim!`
    : `Pengiriman Bertahap (${deliveryNumber}): ${totalShippedPcs} pcs dikirim. Masih terdapat sisa pesanan.`;

  db.insert('order_status_histories', {
    id: generateId('osh'),
    order_id: order.id,
    status: nextStatus,
    notes: historyNote,
    updated_by_name: created_by || 'Owner',
    created_at: new Date().toISOString(),
  });

  res.status(201).json({
    message: `Pengiriman bertahap berhasil dibuat dengan nomor ${deliveryNumber}!`,
    delivery: newDelivery,
    order: updatedOrder,
  });
});

app.put('/api/deliveries/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  const delivery = db.find('deliveries', (d) => d.id === id);
  if (!delivery) return res.status(404).json({ error: 'Data pengiriman tidak ditemukan' });

  const updates = {
    status,
    ...(notes && { notes }),
    ...(status === 'DELIVERED' && { delivered_at: new Date().toISOString() }),
  };

  const updatedDelivery = db.update('deliveries', id, updates);

  // Sync to order: if all items shipped and delivery is delivered, mark order COMPLETED
  if (status === 'DELIVERED') {
    const allOrderItems = db.filter('order_items', (it) => it.order_id === delivery.order_id);
    const isAllShipped = allOrderItems.every((it) => (it.shipped_quantity || 0) >= it.quantity);
    if (isAllShipped) {
      db.update('orders', delivery.order_id, { status: 'COMPLETED' });
    }
  }

  res.json(updatedDelivery);
});

// -----------------------------------------------------------------------------
// EXPENSES & FINANCE
// -----------------------------------------------------------------------------
app.get('/api/expenses', (req, res) => {
  const expenses = [...db.get('expenses')].sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(expenses);
});

app.post('/api/expenses', (req, res) => {
  const { date, category, title, vendor_or_payee, amount, notes } = req.body;
  if (!title || !amount || !category) {
    return res.status(400).json({ error: 'Kategori, judul dan nominal pengeluaran wajib diisi' });
  }

  const newExpense = {
    id: generateId('exp'),
    date: date || new Date().toISOString().split('T')[0],
    category,
    title,
    vendor_or_payee: vendor_or_payee || '-',
    amount: Number(amount),
    notes: notes || '',
    created_at: new Date().toISOString(),
  };

  db.insert('expenses', newExpense);
  res.status(201).json(newExpense);
});

app.delete('/api/expenses/:id', (req, res) => {
  const { id } = req.params;
  const deleted = db.delete('expenses', id);
  if (!deleted) return res.status(404).json({ error: 'Data pengeluaran tidak ditemukan' });
  res.json({ message: 'Pengeluaran berhasil dihapus' });
});

app.get('/api/finance/summary', (req, res) => {
  const orders = db.get('orders');
  const expenses = db.get('expenses');

  // Completed or confirmed revenue
  const revenueOrders = orders.filter((o) => o.status === 'COMPLETED');
  const totalRevenue = revenueOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  // Potential revenue (in progress or confirmed)
  const pipelineRevenue = orders
    .filter((o) => ['CONFIRMED', 'PRODUCTION', 'READY', 'DELIVERING'].includes(o.status))
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const totalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const estimatedProfit = totalRevenue - totalExpense;

  // Group expenses by category
  const expensesByCategory = {};
  expenses.forEach((e) => {
    expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
  });

  res.json({
    totalRevenue,
    pipelineRevenue,
    totalExpense,
    estimatedProfit,
    completedOrderCount: revenueOrders.length,
    expensesByCategory,
  });
});

// -----------------------------------------------------------------------------
// EMPLOYEES & PAYROLL
// -----------------------------------------------------------------------------
app.get('/api/employees', (req, res) => {
  res.json(db.get('employees'));
});

app.post('/api/employees', (req, res) => {
  const { name, phone, position, salary_type, base_rate } = req.body;
  if (!name || !position || base_rate === undefined) {
    return res.status(400).json({ error: 'Nama, posisi, dan tarif gaji wajib diisi' });
  }

  const employees = db.get('employees');
  const code = `EMP-${String(employees.length + 1).padStart(3, '0')}`;

  const newEmp = {
    id: generateId('emp'),
    employee_code: code,
    name,
    phone: phone || '',
    position,
    salary_type: salary_type || 'MONTHLY',
    base_rate: Number(base_rate),
    join_date: new Date().toISOString().split('T')[0],
    active: true,
  };

  db.insert('employees', newEmp);
  res.status(201).json(newEmp);
});

app.put('/api/employees/:id', (req, res) => {
  const { id } = req.params;
  const updated = db.update('employees', id, req.body);
  if (!updated) return res.status(404).json({ error: 'Pegawai tidak ditemukan' });
  res.json(updated);
});

app.get('/api/payrolls', (req, res) => {
  const payrolls = [...db.get('payrolls')].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(payrolls);
});

app.post('/api/payrolls', (req, res) => {
  const {
    employee_id,
    period,
    salary_type,
    production_items,
    base_salary,
    overtime,
    bonus,
    deduction,
    notes,
  } = req.body;

  const employee = db.find('employees', (e) => e.id === employee_id);
  if (!employee) return res.status(404).json({ error: 'Pegawai tidak ditemukan' });

  const effectiveType = salary_type || employee.salary_type || 'PIECE_RATE';
  let cleanedProductionItems = [];
  let totalPieces = 0;
  let computedBaseSalary = Number(base_salary ?? employee.base_rate);

  if (effectiveType === 'PIECE_RATE' && Array.isArray(production_items)) {
    cleanedProductionItems = production_items
      .map((it) => {
        const qty = Math.max(0, Number(it.quantity || 0));
        const rate = Math.max(0, Number(it.wage_per_piece || 0));
        return {
          product_id: it.product_id || '',
          product_name: it.product_name || 'Produk Seragam',
          quantity: qty,
          wage_per_piece: rate,
          subtotal: qty * rate,
        };
      })
      .filter((it) => it.quantity > 0);

    totalPieces = cleanedProductionItems.reduce((acc, it) => acc + it.quantity, 0);
    computedBaseSalary = cleanedProductionItems.reduce((acc, it) => acc + it.subtotal, 0);
  }

  const ot = Number(overtime || 0);
  const bon = Number(bonus || 0);
  const ded = Number(deduction || 0);
  const totalSal = computedBaseSalary + ot + bon - ded;

  // IMMUTABLE PAYROLL SNAPSHOT (Master plan section 38)
  const newPayroll = {
    id: generateId('prl'),
    employee_id: employee.id,
    employee_name: employee.name, // Snapshot
    position: employee.position, // Snapshot
    salary_type: effectiveType,
    period: period || 'Bulan Berjalan',
    production_items: cleanedProductionItems,
    total_pieces: totalPieces,
    base_salary: computedBaseSalary,
    overtime: ot,
    bonus: bon,
    deduction: ded,
    total_salary: totalSal,
    status: 'CALCULATED',
    payment_date: null,
    notes: notes || '',
    created_at: new Date().toISOString(),
  };

  db.insert('payrolls', newPayroll);
  res.status(201).json(newPayroll);
});

app.put('/api/payrolls/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, payment_date } = req.body;

  const payroll = db.find('payrolls', (p) => p.id === id);
  if (!payroll) return res.status(404).json({ error: 'Payroll tidak ditemukan' });

  const updates = {
    status,
    ...(status === 'PAID' && {
      payment_date: payment_date || new Date().toISOString().split('T')[0],
    }),
  };

  const updated = db.update('payrolls', id, updates);

  // If marked PAID, auto-record expense in category 'Payroll'
  if (status === 'PAID') {
    db.insert('expenses', {
      id: generateId('exp'),
      date: updates.payment_date,
      category: 'Payroll',
      title: `Gaji ${payroll.employee_name} (${payroll.period})`,
      vendor_or_payee: payroll.employee_name,
      amount: payroll.total_salary,
      notes: `Slip gaji ref #${payroll.id}`,
      created_at: new Date().toISOString(),
    });
  }

  res.json(updated);
});

// -----------------------------------------------------------------------------
// DASHBOARD STATS
// -----------------------------------------------------------------------------
app.get('/api/dashboard/stats', (req, res) => {
  const orders = db.get('orders');
  const stockItems = db.get('stock_items');
  const expenses = db.get('expenses');
  const deliveries = db.get('deliveries');

  const counts = {
    REQUESTED: 0,
    CONFIRMED: 0,
    PRODUCTION: 0,
    READY: 0,
    DELIVERING: 0,
    COMPLETED: 0,
    CANCELLED: 0,
    REJECTED: 0,
  };

  orders.forEach((o) => {
    if (counts[o.status] !== undefined) {
      counts[o.status]++;
    }
  });

  const completedRevenue = orders
    .filter((o) => o.status === 'COMPLETED')
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const totalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const lowStockCount = stockItems.filter((it) => it.quantity <= it.min_stock).length;
  const pendingDeliveries = deliveries.filter((d) => d.status !== 'DELIVERED').length;

  res.json({
    orderCounts: counts,
    totalOrders: orders.length,
    activeOrders: counts.CONFIRMED + counts.PRODUCTION + counts.READY + counts.DELIVERING,
    completedRevenue,
    totalExpense,
    estimatedProfit: completedRevenue - totalExpense,
    lowStockCount,
    pendingDeliveries,
  });
});

// -----------------------------------------------------------------------------
// SYSTEM RESET
// -----------------------------------------------------------------------------
app.post('/api/system/reset', (req, res) => {
  const data = db.reset();
  res.json({ message: 'Database berhasil di-reset ke data bawaan simulasi!', data });
});

app.listen(PORT, () => {
  console.log(`Konveksi API Server running on http://localhost:${PORT}`);
});
