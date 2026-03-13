import { useMemo } from 'react';
import { Printer } from 'lucide-react';
import YearSelector from '../components/layout/YearSelector';
import { useYear } from '../hooks/useYear';
import { useGrants } from '../hooks/useGrants';
import { useCommitments } from '../hooks/useCommitments';
import { useFMV } from '../hooks/useFMV';
import { CATEGORY_LABELS } from '../types';
import type { Category, Grant } from '../types';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format today's date as "Month Day, Year" for the report footer */
function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function Report() {
  const { selectedYear } = useYear();
  const { grants, loading: grantsLoading } = useGrants(selectedYear);
  const { commitments, loading: commitmentsLoading } = useCommitments();
  const { averageFMV, requiredDistribution, loading: fmvLoading } = useFMV(selectedYear);

  const loading = grantsLoading || commitmentsLoading || fmvLoading;

  const sortedGrants = useMemo(
    () => [...grants].sort((a, b) => b.amount - a.amount),
    [grants],
  );

  const totalGranted = useMemo(
    () => grants.reduce((sum, g) => sum + g.amount, 0),
    [grants],
  );

  const multiYearTotal = useMemo(
    () => grants.filter((g) => g.grantType === 'multi-year').reduce((s, g) => s + g.amount, 0),
    [grants],
  );

  const discretionaryTotal = useMemo(
    () => grants.filter((g) => g.grantType === 'annual').reduce((s, g) => s + g.amount, 0),
    [grants],
  );

  const byCategory = useMemo(
    () =>
      grants.reduce<Record<Category, number>>(
        (acc, g) => {
          acc[g.category] = (acc[g.category] || 0) + g.amount;
          return acc;
        },
        { jewish: 0, education: 0, arts: 0 },
      ),
    [grants],
  );

  const selectedYearNum = parseInt(selectedYear);

  const activeCommitments = useMemo(
    () =>
      commitments
        .map((c) => {
          const yearsPaid = Math.max(0, selectedYearNum - c.startYear + 1);
          const yearsRemaining = Math.max(0, c.totalYears - yearsPaid);
          const remainingBalance = yearsRemaining * c.annualPayment;
          return { ...c, yearsRemaining, remainingBalance };
        })
        .filter((c) => c.yearsRemaining > 0),
    [commitments, selectedYearNum],
  );

  return (
    <div>
      {/* ---------- Print-specific styles ---------- */}
      <style>{`
        @media print {
          /* WHY: Hide app chrome (sidebar, header bar) so only the report content prints */
          nav, aside, [data-print-hide] {
            display: none !important;
          }
          body {
            background: white !important;
          }
          /* Let the report content fill the printed page */
          .report-content {
            margin: 0 !important;
            padding: 24px !important;
            box-shadow: none !important;
            border: none !important;
            max-width: 100% !important;
          }
          /* Avoid breaking rows and sections across pages */
          tr, .report-section {
            break-inside: avoid;
          }
        }
      `}</style>

      {/* ---------- Header bar (hidden when printing) ---------- */}
      <div
        data-print-hide
        className="flex items-center justify-between mb-6 print:hidden"
      >
        <div className="flex items-center gap-4">
          <h1 className="text-[24px] font-semibold text-purple-dark">Annual Report</h1>
          <YearSelector />
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple text-white text-[14px] font-medium hover:bg-purple-dark transition-colors"
        >
          <Printer size={16} />
          Save / Share
        </button>
      </div>

      {/* ---------- Loading state ---------- */}
      {loading && (
        <div className="bg-white rounded-xl border border-card-border p-8 text-center">
          <p className="text-warm-gray">Loading report data...</p>
        </div>
      )}

      {/* ---------- Report content (print-friendly) ---------- */}
      {!loading && (
        <div className="report-content bg-white rounded-xl border border-card-border shadow-[0_1px_4px_rgba(150,99,176,0.08)] max-w-[800px] mx-auto p-8">
          {/* Logo */}
          <div className="text-center mb-2">
            <img
              src="/logo.png"
              alt="Ella Riley Adler Foundation"
              className="mx-auto mb-3"
              style={{ maxWidth: 200 }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>

          {/* Title & Subtitle */}
          <h2 className="text-[28px] font-bold text-purple-dark text-center">
            {selectedYear} Annual Giving Report
          </h2>
          <p className="text-[16px] text-warm-gray text-center mb-8">
            Ella Riley Adler Foundation
          </p>

          {/* -------- Key Stats Row -------- */}
          <div className="report-section grid grid-cols-3 gap-4 mb-8">
            <StatBox label="Total Granted" value={formatCurrency(totalGranted)} />
            <StatBox label="5% Required" value={formatCurrency(requiredDistribution)} />
            <StatBox label="Foundation Assets" value={formatCurrency(averageFMV)} />
          </div>

          {/* -------- Multi-Year vs Discretionary -------- */}
          <div className="report-section grid grid-cols-2 gap-4 mb-8">
            <div className="bg-purple-light rounded-xl p-4 text-center">
              <p className="text-[12px] font-medium text-purple-dark uppercase tracking-wide">
                Multi-Year
              </p>
              <p className="text-[24px] font-semibold text-purple-dark mt-1">
                {formatCurrency(multiYearTotal)}
              </p>
            </div>
            <div className="bg-gold-light rounded-xl p-4 text-center">
              <p className="text-[12px] font-medium text-gold-dark uppercase tracking-wide">
                Discretionary
              </p>
              <p className="text-[24px] font-semibold text-gold-dark mt-1">
                {formatCurrency(discretionaryTotal)}
              </p>
            </div>
          </div>

          {/* -------- Full Grant Table -------- */}
          <div className="report-section mb-8">
            <h3 className="text-[18px] font-semibold text-purple-dark mb-3">Grants</h3>
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-purple-light">
                  <th className="text-left px-3 py-2 font-semibold text-purple-dark rounded-tl-lg">
                    Organization
                  </th>
                  <th className="text-left px-3 py-2 font-semibold text-purple-dark">Category</th>
                  <th className="text-right px-3 py-2 font-semibold text-purple-dark">Amount</th>
                  <th className="text-left px-3 py-2 font-semibold text-purple-dark rounded-tr-lg">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedGrants.map((grant: Grant, idx: number) => (
                  <tr
                    key={grant.id}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-warm-gray-lt'}
                    style={{ breakInside: 'avoid' }}
                  >
                    <td className="px-3 py-2 text-text-dark">{grant.granteeName}</td>
                    <td className="px-3 py-2 text-warm-gray">
                      {CATEGORY_LABELS[grant.category]}
                    </td>
                    <td className="px-3 py-2 text-text-dark text-right font-medium">
                      {formatCurrency(grant.amount)}
                    </td>
                    <td className="px-3 py-2 text-warm-gray capitalize">{grant.status}</td>
                  </tr>
                ))}
                {/* Total row */}
                <tr className="border-t-2 border-purple font-semibold">
                  <td className="px-3 py-2 text-purple-dark" colSpan={2}>
                    Total
                  </td>
                  <td className="px-3 py-2 text-purple-dark text-right">
                    {formatCurrency(totalGranted)}
                  </td>
                  <td />
                </tr>
              </tbody>
            </table>
            {sortedGrants.length === 0 && (
              <p className="text-center text-warm-gray py-4 text-[14px]">
                No grants recorded for {selectedYear}.
              </p>
            )}
          </div>

          {/* -------- Category Breakdown -------- */}
          <div className="report-section mb-8">
            <h3 className="text-[18px] font-semibold text-purple-dark mb-3">
              Category Breakdown
            </h3>
            <div className="divide-y divide-card-border border border-card-border rounded-lg">
              {(['jewish', 'education', 'arts'] as Category[]).map((cat) => {
                const amount = byCategory[cat] || 0;
                const pct = totalGranted > 0 ? ((amount / totalGranted) * 100).toFixed(1) : '0.0';
                return (
                  <div
                    key={cat}
                    className="flex items-center justify-between px-4 py-3"
                    style={{ breakInside: 'avoid' }}
                  >
                    <span className="text-[14px] font-medium text-text-dark">
                      {CATEGORY_LABELS[cat]}
                    </span>
                    <span className="text-[14px] text-text-dark">
                      <span className="font-semibold">{formatCurrency(amount)}</span>
                      <span className="text-warm-gray ml-2">({pct}%)</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* -------- Active Multi-Year Commitments -------- */}
          <div className="report-section mb-8">
            <h3 className="text-[18px] font-semibold text-purple-dark mb-3">
              Active Multi-Year Commitments
            </h3>
            {activeCommitments.length === 0 ? (
              <p className="text-[14px] text-warm-gray">No active multi-year commitments.</p>
            ) : (
              <div className="divide-y divide-card-border border border-card-border rounded-lg">
                {activeCommitments.map((c) => (
                  <div
                    key={c.id}
                    className="px-4 py-3"
                    style={{ breakInside: 'avoid' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] font-medium text-text-dark">
                        {c.granteeName}
                      </span>
                      <span className="text-[14px] font-semibold text-purple">
                        {formatCurrency(c.remainingBalance)} remaining
                      </span>
                    </div>
                    <div className="flex gap-4 mt-1 text-[12px] text-warm-gray">
                      <span>{formatCurrency(c.annualPayment)}/yr</span>
                      <span>Total pledge: {formatCurrency(c.totalPledge)}</span>
                      <span>
                        {c.yearsRemaining} yr{c.yearsRemaining !== 1 ? 's' : ''} remaining
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* -------- Mission Statement -------- */}
          <div
            className="report-section bg-gold-light border-l-4 border-gold rounded-r-xl px-5 py-4 mb-8"
            style={{ breakInside: 'avoid' }}
          >
            <p className="text-[14px] text-text-dark italic leading-relaxed">
              &ldquo;Inspired by her passions and grounded in our family&rsquo;s enduring values, we
              support Jewish life and continuity, transformative education, and artistic expression
              &mdash; especially through dance.&rdquo;
            </p>
          </div>

          {/* -------- Footer -------- */}
          <div
            className="report-section flex items-center justify-between text-[12px] text-warm-gray border-t border-card-border pt-4"
            style={{ breakInside: 'avoid' }}
          >
            <span>Foundation EIN: [TBD]</span>
            <span>Report generated {formatDate()}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- Helper component ---- */

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-card-border rounded-lg p-4 text-center">
      <p className="text-[12px] font-medium text-warm-gray uppercase tracking-wide">{label}</p>
      <p className="text-[22px] font-semibold text-purple-dark mt-1">{value}</p>
    </div>
  );
}
