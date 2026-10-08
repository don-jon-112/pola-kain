import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocs, collection } from 'firebase/firestore';
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

// Baca initial products dari data/konveksi.db.json
const dbJsonPath = path.join(__dirname, '..', 'data', 'konveksi.db.json');
let initialProducts = [];
let initialProductSizes = [];

if (fs.existsSync(dbJsonPath)) {
  const raw = JSON.parse(fs.readFileSync(dbJsonPath, 'utf-8'));
  initialProducts = raw.products || [];
  initialProductSizes = raw.product_sizes || [];
}

console.log(`Menemukan ${initialProducts.length} produk awal untuk disinkronkan ke Firestore...`);

for (const prod of initialProducts) {
  // Gabungkan sizes
  const sizes = initialProductSizes.filter(s => s.product_id === prod.id);
  const docData = {
    ...prod,
    sizes: sizes.map(s => ({
      id: s.id,
      size_code: s.size_code,
      size_name: s.size_name,
      price: s.price !== undefined ? Number(s.price) : Number(prod.price),
      sort_order: s.sort_order || 1,
      active: s.active !== false,
    })),
    created_at: prod.created_at || new Date().toISOString(),
    updated_at: prod.updated_at || new Date().toISOString(),
  };

  await setDoc(doc(db, 'products', prod.id), docData, { merge: true });
  console.log(`✅ Disimpan ke Firestore: ${prod.id} - ${prod.name}`);
}

console.log('🎉 Selesai seeding produk ke Cloud Firestore!');
process.exit(0);
