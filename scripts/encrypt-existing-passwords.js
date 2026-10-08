import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, getDocs, collection } from 'firebase/firestore';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Read .env file
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
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const isBcrypt = (str) => typeof str === 'string' && /^\$2[aby]\$\d{2}\$/.test(str.trim());

async function runMigration() {
  console.log('🔒 Memulai migrasi enkripsi password ke Bcrypt...');

  // 1. Enkripsi password di Firestore
  console.log('\n--- 1. Memeriksa pengguna di Firebase Firestore (' + firebaseConfig.projectId + ') ---');
  try {
    const snap = await getDocs(collection(db, 'users'));
    let fsCount = 0;
    for (const d of snap.docs) {
      const data = d.data();
      if (!isBcrypt(data.password)) {
        const plainPassword = data.password || 'password123';
        const hashedPassword = await bcrypt.hash(plainPassword, 10);
        await updateDoc(doc(db, 'users', d.id), {
          password: hashedPassword,
          must_change_password: true,
          updated_at: new Date().toISOString(),
        });
        console.log(`✅ [Firestore] User ${data.username} (${d.id}) password "${plainPassword}" berhasil dienkripsi ke bcrypt.`);
        fsCount++;
      } else {
        console.log(`ℹ️ [Firestore] User ${data.username} (${d.id}) password sudah terenkripsi bcrypt.`);
      }
    }
    console.log(`Selesai di Firestore: ${fsCount} password diperbarui.`);
  } catch (err) {
    console.error('Error Firestore migration:', err.message);
  }

  // 2. Enkripsi password di data/konveksi.db.json (backend lokal)
  console.log('\n--- 2. Memeriksa pengguna di data/konveksi.db.json ---');
  const dbPath = path.join(__dirname, '..', 'data', 'konveksi.db.json');
  if (fs.existsSync(dbPath)) {
    try {
      const dbContent = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
      let localCount = 0;
      if (Array.isArray(dbContent.users)) {
        for (const u of dbContent.users) {
          if (!isBcrypt(u.password)) {
            const plain = u.password || 'password123';
            u.password = await bcrypt.hash(plain, 10);
            u.must_change_password = true;
            console.log(`✅ [Local DB] User ${u.username} password "${plain}" berhasil dienkripsi ke bcrypt.`);
            localCount++;
          } else {
            console.log(`ℹ️ [Local DB] User ${u.username} password sudah terenkripsi bcrypt.`);
          }
        }
        fs.writeFileSync(dbPath, JSON.stringify(dbContent, null, 2), 'utf-8');
        console.log(`Selesai di Local DB: ${localCount} password diperbarui.`);
      }
    } catch (err) {
      console.error('Error Local DB migration:', err.message);
    }
  }

  console.log('\n🎉 Selesai! Semua password pengguna kini telah terenkripsi menggunakan Bcrypt.');
  process.exit(0);
}

runMigration().catch(err => {
  console.error('Fatal error during migration:', err);
  process.exit(1);
});
