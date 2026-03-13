import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import type { Grant } from '../types';

export function useGrants(year: string) {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!year) return;
    setLoading(true);
    const q = query(
      collection(db, 'years', year, 'grants'),
      orderBy('amount', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Grant[];
      setGrants(data);
      setLoading(false);
    }, (error) => {
      console.error('Grants listener error:', error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [year]);

  return { grants, loading };
}
