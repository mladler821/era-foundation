import { useYear } from '../../hooks/useYear';
import { ChevronDown } from 'lucide-react';

export default function YearSelector() {
  const { selectedYear, setSelectedYear, availableYears } = useYear();

  return (
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
  );
}
