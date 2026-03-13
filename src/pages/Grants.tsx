import YearSelector from '../components/layout/YearSelector';
import { useYear } from '../hooks/useYear';

export default function Grants() {
  const { selectedYear } = useYear();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[24px] font-semibold text-purple-dark">{selectedYear} Grants</h1>
        <YearSelector />
      </div>
      <div className="bg-white rounded-xl border border-card-border p-8 text-center">
        <p className="text-warm-gray">Grants page — coming in Phase 4</p>
      </div>
    </div>
  );
}
