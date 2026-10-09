// Firebase Configuration & Firestore Database Service for Konveksi Management System
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { hashPassword } from '../utils/crypto';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

// Check if valid Firebase configuration has been provided
export const isFirebaseConfigured = () => {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.apiKey !== 'YOUR_FIREBASE_API_KEY'
  );
};

// Initialize Firebase only once
let app = null;
let db = null;
let auth = null;

if (isFirebaseConfigured()) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
    console.log('🔥 Firebase successfully initialized for project:', firebaseConfig.projectId);
  } catch (err) {
    console.warn('⚠️ Firebase initialization warning:', err.message);
  }
}

export { app, db, auth };

// Generic Firestore Helpers
export const getCollectionData = async (collectionName, orderField = null, orderDirection = 'desc') => {
  if (!db) return null;
  try {
    const collRef = collection(db, collectionName);
    const q = orderField ? query(collRef, orderBy(orderField, orderDirection)) : collRef;
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error(`Error reading ${collectionName} from Firestore:`, err);
    throw err;
  }
};

export const createDocument = async (collectionName, data, customId = null) => {
  if (!db) return null;
  try {
    const payload = {
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _serverTimestamp: serverTimestamp(),
    };
    if (customId) {
      const docRef = doc(db, collectionName, customId);
      await setDoc(docRef, payload, { merge: true });
      return { id: customId, ...payload };
    } else {
      const docRef = await addDoc(collection(db, collectionName), payload);
      return { id: docRef.id, ...payload };
    }
  } catch (err) {
    console.error(`Error adding to ${collectionName}:`, err);
    throw err;
  }
};

export const updateDocument = async (collectionName, id, updateData) => {
  if (!db) return null;
  try {
    const docRef = doc(db, collectionName, id);
    const payload = {
      ...updateData,
      updated_at: new Date().toISOString(),
    };
    await updateDoc(docRef, payload);
    return { id, ...payload };
  } catch (err) {
    console.error(`Error updating ${collectionName}/${id}:`, err);
    throw err;
  }
};

export const deleteDocument = async (collectionName, id) => {
  if (!db) return null;
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
    return { id, success: true };
  } catch (err) {
    console.error(`Error deleting ${collectionName}/${id}:`, err);
    throw err;
  }
};

// Firestore Collections Constants
export const COLLECTIONS = {
  USERS: 'users',
  CUSTOMERS: 'customers',
  PRODUCTS: 'products',
  ORDERS: 'orders',
  DELIVERIES: 'deliveries',
  INVENTORY: 'inventory',
  PAYROLLS: 'payrolls',
  EMPLOYEES: 'employees',
  FINANCE: 'financial_transactions',
};

// Initial Default Customers Data
export const DEFAULT_CUSTOMERS = [
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
];

// Auto-seed default customers if customers collection is empty in Firestore
export const ensureDefaultCustomersInFirestore = async () => {
  if (!db) return;
  try {
    const custColl = collection(db, 'customers');
    const snap = await getDocs(custColl);
    if (snap.empty) {
      console.log('🌱 Firestore customers collection is empty. Seeding default customers...');
      for (const cust of DEFAULT_CUSTOMERS) {
        await setDoc(doc(db, 'customers', cust.id), cust);
      }
      console.log('✅ Default customers successfully seeded to Firestore!');
    }
  } catch (err) {
    console.warn('Note on Firestore customers check/seed:', err.message);
  }
};

// Auto-seed default admin accounts if users collection is empty in Firestore
export const ensureDefaultAdminInFirestore = async () => {
  if (!db) return;
  try {
    const usersColl = collection(db, 'users');
    const snap = await getDocs(usersColl);
    if (snap.empty) {
      console.log('🌱 Firestore users collection is empty. Seeding default Admin & Owner accounts with bcrypt hash...');
      const defaultHash = await hashPassword('password123');
      await setDoc(doc(db, 'users', 'usr_superadmin'), {
        id: 'usr_superadmin',
        username: 'superadmin',
        email: 'superadmin@konveksi.id',
        password: defaultHash,
        name: 'Super Admin Utama',
        role: 'SUPER_ADMIN',
        active: true,
        must_change_password: true,
        created_at: new Date().toISOString(),
      });

      await setDoc(doc(db, 'users', 'usr_owner'), {
        id: 'usr_owner',
        username: 'owner',
        email: 'owner@konveksi.id',
        password: defaultHash,
        name: 'Pak Hendra (Owner)',
        role: 'OWNER',
        active: true,
        must_change_password: true,
        created_at: new Date().toISOString(),
      });
      console.log('✅ Default accounts (superadmin / owner) successfully seeded to Firestore with bcrypt encrypted password!');
    }
  } catch (err) {
    console.warn('Note on Firestore users check/seed:', err.message);
  }
};


