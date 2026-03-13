import { useState, useMemo } from 'react';
import { Search, Plus, FileText } from 'lucide-react';
import YearSelector from '../components/layout/YearSelector';
import GrantCard from '../components/grants/GrantCard';
import GrantForm from '../components/grants/GrantForm';
import EmptyState from '../components/ui/EmptyState';
import { useYear } from '../hooks/useYear';
import { useGrants } from '../hooks/useGrants';
import type { Grant } from '../types';

type FilterTab = 'all' | 'multi-year' | 'discretionary';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function Grants() {
  const { selectedYear } = useYear();
  const { grants, loading } = useGrants(selectedYear);

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingGrant, setEditingGrant] = useState<Grant | null>(null);

  // Tab counts — computed once, not per-render of each tab
  const multiYearGrants = useMemo(() => grants.filter((g) => g.grantType === 'multi-year'), [grants]);
  const discretionaryGrants = useMemo(() => grants.filter((g) => g.grantType === 'annual'), [grants]);

  const tabCounts: Record<FilterTab, number> = {
    all: grants.length,
    'multi-year': multiYearGrants.length,
    discretionary: discretionaryGrants.length,
  };

  // Apply tab filter, then search filter
  const filteredGrants = useMemo(() => {
    let result = grants;
    if (activeTab === 'multi-year') result = multiYearGrants;
    else if (activeTab === 'discretionary') result = discretionaryGrants;

    const query = search.trim().toLowerCase();
    if (query) {
      result = result.filter((g) => g.granteeName.toLowerCase().includes(query));
    }

    return result;
  }, [grants, multiYearGrants, discretionaryGrants, activeTab, search]);

  const totalAmount = filteredGrants.reduce((sum, g) => sum + g.amount, 0);

  function handleAddGrant() {
    setEditingGrant(null);
    setFormOpen(true);
  }

  function handleEditGrant(grant: Grant) {
    setEditingGrant(grant);
    setFormOpen(true);
  }

  function handleCloseForm() {
    setFormOpen(false);
    setEditingGrant(null);
  }

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'multi-year', label: 'Multi-Year' },
    { key: 'discretionary', label: 'Discretionary' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[24px] font-semibold text-purple-dark">{selectedYear} Grants</h1>
        <div className="flex items-center gap-3">
          <YearSelector />
          <button
            onClick={handleAddGrant}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-purple text-white text-[14px] font-medium hover:bg-purple-dark transition-colors min-h-[44px]"
          >
            <Plus size={18} />
            Add Grant
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-warm-gray-lt rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-3 py-2 rounded-md text-[13px] font-medium transition-colors min-h-[44px] ${
              activeTab === tab.key
                ? 'bg-white text-purple-dark shadow-sm'
                : 'text-warm-gray hover:text-text-dark'
            }`}
          >
            {tab.label} ({tabCounts[tab.key]})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by grantee name..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-card-border text-[14px] text-text-dark placeholder:text-warm-gray focus:outline-none focus:ring-2 focus:ring-purple/30 focus:border-purple min-h-[44px]"
        />
      </div>

      {/* Grant list */}
      {loading ? (
        <div className="bg-white rounded-xl border border-card-border p-8 text-center">
          <p className="text-[14px] text-warm-gray">Loading grants...</p>
        </div>
      ) : filteredGrants.length === 0 ? (
        <div className="bg-white rounded-xl border border-card-border">
          <EmptyState
            icon={<FileText size={32} />}
            title={search ? 'No matching grants' : 'No grants yet'}
            description={
              search
                ? `No grants match "${search}". Try a different search term.`
                : `Add your first grant for ${selectedYear} to get started.`
            }
            action={
              !search ? (
                <button
                  onClick={handleAddGrant}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-purple text-white text-[14px] font-medium hover:bg-purple-dark transition-colors min-h-[44px]"
                >
                  <Plus size={18} />
                  Add Grant
                </button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="space-y-2">
          {filteredGrants.map((grant) => (
            <GrantCard key={grant.id} grant={grant} onEdit={handleEditGrant} />
          ))}
        </div>
      )}

      {/* Bottom totals row */}
      {!loading && filteredGrants.length > 0 && (
        <div className="flex items-center justify-between bg-white rounded-xl border border-card-border px-5 py-3 shadow-[0_1px_4px_rgba(150,99,176,0.08)]">
          <span className="text-[14px] font-medium text-warm-gray">
            {filteredGrants.length} grant{filteredGrants.length !== 1 ? 's' : ''}
          </span>
          <span className="text-[16px] font-semibold text-purple-dark">
            {formatCurrency(totalAmount)}
          </span>
        </div>
      )}

      {/* Grant form modal */}
      <GrantForm open={formOpen} onClose={handleCloseForm} grant={editingGrant} />
    </div>
  );
}
