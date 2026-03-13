import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useYear } from '../../hooks/useYear';
import { ChevronDown, Plus } from 'lucide-react';

export default function YearSelector() {
  const { selectedYear, setSelectedYear, availableYears } = useYear();
  const [adding, setAdding] = useState(false);

  async function addNextYear() {
    setAdding(true);
    try {
      // WHY: Derive the next year from the most recent available year
      const maxYear = Math.max(...availableYears.map(Number));
      const nextYear = String(maxYear + 1);
      await setDoc(doc(db, 'years', nextYear), { fmvEntries: [], budgetTargets: null });
      // WHY: Auto-select the newly created year so the user lands on it immediately
      setSelectedYear(nextYear);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <div className="relative inline-flex items-center">
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="appearance-none bg-white border border-card-border rounded-lg px-3 py-1.5 pr-8 text-[14px] font-semibold text-purple-dark cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple/30"
        >
          {availableYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-2.5 text-purple-dark pointer-events-none" />
      </div>
      <button
        onClick={addNextYear}
        disabled={adding}
        title="Add next year"
        className="w-7 h-7 flex items-center justify-center rounded-lg border border-card-border bg-white text-purple-dark hover:bg-purple-light transition-colors disabled:opacity-50"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
