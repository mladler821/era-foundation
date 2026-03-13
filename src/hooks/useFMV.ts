import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { FMVEntry } from '../types';

export function useFMV(year: string) {
  const [fmvEntries, setFmvEntries] = useState<FMVEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!year) return;
    setLoading(true);
    const yearRef = doc(db, 'years', year);
    const unsubscribe = onSnapshot(yearRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setFmvEntries(data.fmvEntries || []);
      } else {
        setFmvEntries([]);
      }
      setLoading(false);
    }, (error) => {
      console.error('FMV listener error:', error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [year]);

  const updateFMV = useCallback(async (entries: FMVEntry[]) => {
    const yearRef = doc(db, 'years', year);
    await setDoc(yearRef, { fmvEntries: entries }, { merge: true });
  }, [year]);

  // Calculate average FMV from entries that have values
  const averageFMV = fmvEntries.length > 0
    ? fmvEntries.filter(e => e.value > 0).reduce((sum, e) => sum + e.value, 0) /
      (fmvEntries.filter(e => e.value > 0).length || 1)
    : 0;

  // Required 5% distribution based on average monthly FMV
  const requiredDistribution = averageFMV * 0.05;

  return { fmvEntries, loading, updateFMV, averageFMV, requiredDistribution };
}
