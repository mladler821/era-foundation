import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import type { Commitment } from '../types';

export function useCommitments() {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'commitments'), orderBy('totalPledge', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Commitment[];
      setCommitments(data);
      setLoading(false);
    }, (error) => {
      console.error('Commitments listener error:', error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { commitments, loading };
}
