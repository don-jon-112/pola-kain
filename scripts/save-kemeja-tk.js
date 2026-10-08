import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, deleteDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value.trim();
  }
});

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Hapus prod_1791482620284_lnz24 dan prod_1791482620291_7wszz jika ada
await deleteDoc(doc(db, 'products', 'prod_1791482620284_lnz24')).catch(() => {});
await deleteDoc(doc(db, 'products', 'prod_1791482620291_7wszz')).catch(() => {});

const targetProduct = {
  id: 'prod_kemeja_tk',
  name: 'Kemeja TK',
  code: 'TKK',
  category: 'TK',
  description: '',
  price: 24000,
  wage_per_piece: 10000,
  has_size: true,
  active: true,
  sizes: [
    { id: 'psz_tk_s', size_code: 'S', size_name: 'Size S', price: 24000, sort_order: 1, active: true },
    { id: 'psz_tk_m', size_code: 'M', size_name: 'Size M', price: 24000, sort_order: 2, active: true },
    { id: 'psz_tk_l', size_code: 'L', size_name: 'Size L', price: 24000, sort_order: 3, active: true },
    { id: 'psz_tk_xl', size_code: 'XL', size_name: 'Size XL', price: 24000, sort_order: 4, active: true },
    { id: 'psz_tk_xxl', size_code: 'XXL', size_name: 'Size XXL', price: 24000, sort_order: 5, active: true },
    { id: 'psz_tk_xxxl', size_code: 'XXXL', size_name: 'Size XXXL', price: 24000, sort_order: 6, active: true },
  ],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

await setDoc(doc(db, 'products', 'prod_kemeja_tk'), targetProduct, { merge: true });
console.log('✅ Kemeja TK successfully saved to Cloud Firestore!');

// Update data/konveksi.db.json juga
const dbJsonPath = path.join(__dirname, '..', 'data', 'konveksi.db.json');
if (fs.existsSync(dbJsonPath)) {
  const dbData = JSON.parse(fs.readFileSync(dbJsonPath, 'utf-8'));
  dbData.products = dbData.products.filter(p => !p.id.startsWith('prod_1791482620284') && !p.id.startsWith('prod_1791482620291') && p.id !== 'prod_kemeja_tk');
  dbData.products.unshift({
    id: targetProduct.id,
    code: targetProduct.code,
    name: targetProduct.name,
    description: targetProduct.description,
    category: targetProduct.category,
    has_size: targetProduct.has_size,
    price: targetProduct.price,
    wage_per_piece: targetProduct.wage_per_piece,
    active: true,
    created_at: targetProduct.created_at,
    updated_at: targetProduct.updated_at,
  });

  // Hapus size lama jika ada dan tambahkan yang baru
  dbData.product_sizes = dbData.product_sizes.filter(s => s.product_id !== 'prod_kemeja_tk' && !s.product_id.startsWith('prod_1791482620284') && !s.product_id.startsWith('prod_1791482620291'));
  targetProduct.sizes.forEach(s => {
    dbData.product_sizes.push({
      id: s.id,
      product_id: 'prod_kemeja_tk',
      size_code: s.size_code,
      size_name: s.size_name,
      price: s.price,
      sort_order: s.sort_order,
      active: true,
    });
  });

  fs.writeFileSync(dbJsonPath, JSON.stringify(dbData, null, 2), 'utf-8');
  console.log('✅ Kemeja TK successfully added to local konveksi.db.json!');
}

process.exit(0);
