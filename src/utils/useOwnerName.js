import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const sanitizeOwnerName = (name) => {
  if (!name || typeof name !== 'string') return 'Owner';
  const stripped = name.replace(/\s*\(Owner\)/i, '').trim();
  // Jika masih memakai dummy seed lama 'Pak Hendra', defaultkan ke 'Owner'
  if (stripped.toLowerCase().includes('hendra')) {
    return 'Owner';
  }
  return stripped || 'Owner';
};

export function useOwnerName() {
  const { user } = useAuth();
  const [ownerName, setOwnerName] = useState(() => {
    if (user?.role === 'OWNER' && user?.name) {
      return sanitizeOwnerName(user.name);
    }
    return 'Owner';
  });

  useEffect(() => {
    let isMounted = true;

    const resolveOwner = async () => {
      // 1. Jika user yang login saat ini adalah OWNER
      if (user?.role === 'OWNER' && user?.name) {
        if (isMounted) setOwnerName(sanitizeOwnerName(user.name));
        return;
      }

      // 2. Ambil dari Firestore data user dengan role OWNER
      if (db) {
        try {
          const q = query(collection(db, 'users'), where('role', '==', 'OWNER'));
          const snap = await getDocs(q);
          if (!snap.empty && isMounted) {
            const docData = snap.docs[0].data();
            if (docData?.name) {
              setOwnerName(sanitizeOwnerName(docData.name));
              return;
            }
          }
        } catch (err) {
          console.warn('Error fetching owner name from Firestore:', err.message);
        }
      }

      // 3. Fallback jika menggunakan Express local API
      try {
        const res = await fetch('/api/users');
        const data = await res.json();
        if (Array.isArray(data) && isMounted) {
          const found = data.find((u) => u.role === 'OWNER');
          if (found?.name) {
            setOwnerName(sanitizeOwnerName(found.name));
            return;
          }
        }
      } catch (e) {
        // Backend offline
      }
    };

    resolveOwner();

    return () => {
      isMounted = false;
    };
  }, [user]);

  return ownerName || 'Owner';
}
