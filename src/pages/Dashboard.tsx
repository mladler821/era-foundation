import YearSelector from '../components/layout/YearSelector';
import MetricCard from '../components/ui/MetricCard';
import ProgressBar from '../components/ui/ProgressBar';
import CategoryBadge from '../components/ui/CategoryBadge';
import { useYear } from '../hooks/useYear';
import { useGrants } from '../hooks/useGrants';
import { useCommitments } from '../hooks/useCommitments';
import { useFMV } from '../hooks/useFMV';
import type { Category } from '../types';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

export default function Dashboard() {
  const { selectedYear } = useYear();
  const { grants } = useGrants(selectedYear);
  const { commitments } = useCommitments();
  const { requiredDistribution } = useFMV(selectedYear);

  const totalGranted = grants.reduce((sum, g) => sum + g.amount, 0);
  const grantCount = grants.length;
  const pctDistributed = requiredDistribution > 0 ? (totalGranted / requiredDistribution) * 100 : 0;

  // Category breakdown
  const byCategory = grants.reduce<Record<Category, number>>((acc, g) => {
    acc[g.category] = (acc[g.category] || 0) + g.amount;
    return acc;
  }, { jewish: 0, education: 0, arts: 0 });

  // Multi-year vs discretionary split
  const multiYearTotal = grants.filter(g => g.grantType === 'multi-year').reduce((s, g) => s + g.amount, 0);
  const discretionaryTotal = grants.filter(g => g.grantType === 'annual').reduce((s, g) => s + g.amount, 0);

  // Outstanding obligations from commitments
  const selectedYearNum = parseInt(selectedYear);
  const outstandingCommitments = commitments.map(c => {
    const yearsPaid = Math.max(0, selectedYearNum - c.startYear + 1);
    const yearsRemaining = Math.max(0, c.totalYears - yearsPaid);
    const remainingBalance = yearsRemaining * c.annualPayment;
    return { ...c, yearsRemaining, remainingBalance };
  }).filter(c => c.yearsRemaining > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[24px] font-semibold text-purple-dark">{selectedYear} Dashboard</h1>
        <YearSelector />
      </div>

      {/* Logo + Tagline */}
      <div className="text-center py-4">
        <img
          src="/logo.png"
          alt="Ella Riley Adler Foundation"
          className="w-[180px] mx-auto mb-2"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <p className="text-[14px] text-warm-gray italic">
          Amplifying the joy, light, and love she brought into the world
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard label="Granted YTD" value={formatCurrency(totalGranted)} />
        <MetricCard label="Grant Count" value={String(grantCount)} />
        <MetricCard
          label="5% Status"
          value={requiredDistribution > 0 ? `${pctDistributed.toFixed(1)}%` : 'No FMV data'}
        />
      </div>

      {/* 5% Distribution Progress */}
      <div className="bg-white rounded-xl border border-card-border p-5 shadow-[0_1px_4px_rgba(150,99,176,0.08)]">
        <ProgressBar percentage={pctDistributed} label="5% Distribution Progress" />
        <div className="flex justify-between text-[13px] text-warm-gray mt-2">
          <span>Required: {formatCurrency(requiredDistribution)}</span>
          <span>Distributed: {formatCurrency(totalGranted)}</span>
        </div>
      </div>

      {/* Multi-Year vs Discretionary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-purple-light rounded-xl p-4 text-center">
          <p className="text-[12px] font-medium text-purple-dark uppercase tracking-wide">Multi-Year</p>
          <p className="text-[24px] font-semibold text-purple-dark mt-1">{formatCurrency(multiYearTotal)}</p>
        </div>
        <div className="bg-gold-light rounded-xl p-4 text-center">
          <p className="text-[12px] font-medium text-gold-dark uppercase tracking-wide">Discretionary</p>
          <p className="text-[24px] font-semibold text-gold-dark mt-1">{formatCurrency(discretionaryTotal)}</p>
        </div>
      </div>

      {/* Outstanding Multi-Year Obligations */}
      <div className="bg-white rounded-xl border border-card-border shadow-[0_1px_4px_rgba(150,99,176,0.08)]">
        <div className="px-5 py-3 border-b border-card-border">
          <h2 className="text-[18px] font-semibold text-purple-dark">Outstanding Multi-Year Obligations</h2>
        </div>
        <div className="divide-y divide-card-border">
          {outstandingCommitments.length === 0 ? (
            <p className="px-5 py-4 text-[14px] text-warm-gray">No active commitments</p>
          ) : (
            outstandingCommitments.map((c) => (
              <div key={c.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-medium text-text-dark">{c.granteeName}</p>
                  <p className="text-[12px] text-warm-gray">
                    {formatCurrency(c.annualPayment)}/yr · {c.yearsRemaining} yr{c.yearsRemaining !== 1 ? 's' : ''} remaining
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[16px] font-semibold text-purple">{formatCurrency(c.remainingBalance)}</p>
                  <CategoryBadge category={c.category} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* By Focus Area */}
      <div className="bg-white rounded-xl border border-card-border shadow-[0_1px_4px_rgba(150,99,176,0.08)]">
        <div className="px-5 py-3 border-b border-card-border">
          <h2 className="text-[18px] font-semibold text-purple-dark">By Focus Area</h2>
        </div>
        <div className="divide-y divide-card-border">
          {(['jewish', 'education', 'arts'] as Category[]).map((cat) => {
            const amount = byCategory[cat] || 0;
            const pct = totalGranted > 0 ? ((amount / totalGranted) * 100).toFixed(1) : '0.0';
            return (
              <div key={cat} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CategoryBadge category={cat} />
                </div>
                <div className="text-right">
                  <p className="text-[16px] font-semibold text-text-dark">{formatCurrency(amount)}</p>
                  <p className="text-[12px] text-warm-gray">{pct}% of total</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mission Statement */}
      <div className="bg-gold-light border-l-4 border-gold rounded-r-xl px-5 py-4">
        <p className="text-[14px] text-text-dark italic leading-relaxed">
          "Inspired by her passions and grounded in our family's enduring values, we support Jewish
          life and continuity, transformative education, and artistic expression — especially through dance."
        </p>
      </div>
    </div>
  );
}
