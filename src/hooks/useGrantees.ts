import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import type { Grantee } from '../types';

export function useGrantees() {
  const [grantees, setGrantees] = useState<Grantee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'grantees'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Grantee[];
      setGrantees(data);
      setLoading(false);
    }, (error) => {
      console.error('Grantees listener error:', error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { grantees, loading };
}
