import { createContext, useContext } from 'react';

interface YearContextValue {
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  availableYears: string[];
}

export const YearContext = createContext<YearContextValue | null>(null);

export function useYear() {
  const ctx = useContext(YearContext);
  if (!ctx) throw new Error('useYear must be used within YearProvider');
  return ctx;
}
