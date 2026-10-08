import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocs, collection } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env file manually
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

console.log('Connecting to Firebase Project:', firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

import bcrypt from 'bcryptjs';

const initialUsers = [
  {
    id: 'usr_superadmin',
    username: 'superadmin',
    email: 'superadmin@konveksi.id',
    name: 'Super Admin Utama',
    role: 'SUPER_ADMIN',
    customer_id: null,
    must_change_password: true,
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'usr_owner',
    username: 'owner',
    email: 'owner@konveksi.id',
    name: 'Pak Hendra (Owner)',
    role: 'OWNER',
    customer_id: null,
    must_change_password: true,
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'usr_cust_smp',
    username: 'cust_smp',
    email: 'admin@smpharapan.sch.id',
    name: 'SMP Harapan Bangsa (Ibu Lina)',
    role: 'CUSTOMER',
    customer_id: 'cust_01',
    must_change_password: true,
    active: true,
    created_at: new Date().toISOString(),
  },
];

async function seed() {
  try {
    const defaultHash = await bcrypt.hash('password123', 10);
    for (const u of initialUsers) {
      console.log(`Adding user: ${u.username} (${u.role}) with bcrypt hashed password...`);
      await setDoc(doc(db, 'users', u.id), { ...u, password: defaultHash }, { merge: true });
    }
    console.log('🎉 Successfully created users in Firestore with bcrypt encrypted password!');

    const snap = await getDocs(collection(db, 'users'));
    console.log(`Total users in Firestore now: ${snap.size}`);
    snap.forEach(d => console.log(` - ${d.id}: ${d.data().username} (${d.data().role})`));
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding Firestore:', err);
    process.exit(1);
  }
}

seed();
