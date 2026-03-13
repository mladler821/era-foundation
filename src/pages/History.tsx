import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { db } from '../firebase';
import { useYear } from '../hooks/useYear';
import MetricCard from '../components/ui/MetricCard';
import { categoryChartColors } from '../theme';
import type { Grant, Category } from '../types';
import { CATEGORY_LABELS } from '../types';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Recharts custom tooltip for the stacked bar chart */
function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((sum, entry) => sum + entry.value, 0);
  return (
    <div className="bg-white border border-card-border rounded-lg shadow-lg p-3">
      <p className="text-[14px] font-semibold text-purple-dark mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-[13px] text-text-dark" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
      <p className="text-[13px] font-semibold text-text-dark mt-1 pt-1 border-t border-card-border">
        Total: {formatCurrency(total)}
      </p>
    </div>
  );
}

export default function History() {
  const { availableYears } = useYear();
  const [allData, setAllData] = useState<Record<string, Grant[]>>({});
  const [loading, setLoading] = useState(true);

  // WHY: Subscribe to grants for every available year so we can aggregate
  // historical data across the full foundation timeline.
  useEffect(() => {
    if (availableYears.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let initialLoadCount = 0;
    const totalYears = availableYears.length;
    const unsubs: (() => void)[] = [];

    for (const year of availableYears) {
      const q = query(
        collection(db, 'years', year, 'grants'),
        orderBy('amount', 'desc'),
      );
      const unsub = onSnapshot(
        q,
        (snap) => {
          const grants = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Grant[];
          setAllData((prev) => ({ ...prev, [year]: grants }));
          initialLoadCount++;
          if (initialLoadCount >= totalYears) setLoading(false);
        },
        (error) => {
          console.error(`Grants listener error for year ${year}:`, error);
          initialLoadCount++;
          if (initialLoadCount >= totalYears) setLoading(false);
        },
      );
      unsubs.push(unsub);
    }

    return () => unsubs.forEach((u) => u());
  }, [availableYears]);

  // Sort years ascending for chronological display
  const sortedYears = useMemo(
    () => [...availableYears].sort((a, b) => Number(a) - Number(b)),
    [availableYears],
  );

  // Flatten all grants for aggregate calculations
  const allGrants = useMemo(
    () => Object.values(allData).flat(),
    [allData],
  );

  // --- Section 1: Summary metrics ---
  const totalGiving = useMemo(
    () => allGrants.reduce((sum, g) => sum + g.amount, 0),
    [allGrants],
  );
  const yearsActive = useMemo(
    () => sortedYears.filter((y) => (allData[y]?.length ?? 0) > 0).length,
    [sortedYears, allData],
  );
  const totalGrantCount = allGrants.length;

  // --- Section 2: Stacked bar chart data ---
  const chartData = useMemo(
    () =>
      sortedYears.map((year) => {
        const grants = allData[year] ?? [];
        const jewish = grants
          .filter((g) => g.category === 'jewish')
          .reduce((s, g) => s + g.amount, 0);
        const education = grants
          .filter((g) => g.category === 'education')
          .reduce((s, g) => s + g.amount, 0);
        const arts = grants
          .filter((g) => g.category === 'arts')
          .reduce((s, g) => s + g.amount, 0);
        return { year, jewish, education, arts };
      }),
    [sortedYears, allData],
  );

  // --- Section 3: Category breakdown by year (table rows) ---
  const tableRows = useMemo(
    () =>
      sortedYears.map((year) => {
        const grants = allData[year] ?? [];
        const byCategory: Record<Category, number> = { jewish: 0, education: 0, arts: 0 };
        grants.forEach((g) => {
          byCategory[g.category] += g.amount;
        });
        const total = grants.reduce((s, g) => s + g.amount, 0);
        return { year, ...byCategory, total };
      }),
    [sortedYears, allData],
  );

  // --- Section 4: Grant type distribution ---
  const grantTypeStats = useMemo(() => {
    const multiYear = allGrants.filter((g) => g.grantType === 'multi-year');
    const annual = allGrants.filter((g) => g.grantType === 'annual');
    return {
      multiYear: {
        count: multiYear.length,
        total: multiYear.reduce((s, g) => s + g.amount, 0),
      },
      annual: {
        count: annual.length,
        total: annual.reduce((s, g) => s + g.amount, 0),
      },
    };
  }, [allGrants]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-[24px] font-semibold text-purple-dark">Giving History</h1>
        <div className="bg-white rounded-xl border border-card-border p-8 text-center">
          <p className="text-warm-gray">Loading historical data…</p>
        </div>
      </div>
    );
  }

  if (availableYears.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-[24px] font-semibold text-purple-dark">Giving History</h1>
        <div className="bg-white rounded-xl border border-card-border p-8 text-center">
          <p className="text-warm-gray">No year data available yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-[24px] font-semibold text-purple-dark">Giving History</h1>

      {/* Section 1: Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard label="Total Giving" value={formatCurrency(totalGiving)} />
        <MetricCard label="Years Active" value={String(yearsActive)} />
        <MetricCard label="Total Grants" value={String(totalGrantCount)} />
      </div>

      {/* Section 2: Annual Giving History (stacked bar chart) */}
      <div className="bg-white rounded-xl border border-card-border shadow-[0_1px_4px_rgba(150,99,176,0.08)]">
        <div className="px-5 py-3 border-b border-card-border">
          <h2 className="text-[18px] font-semibold text-purple-dark">Annual Giving History</h2>
        </div>
        <div className="p-5">
          {/* WHY: 400px min-height keeps the chart readable even with few years */}
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0DCE5" />
              <XAxis dataKey="year" tick={{ fill: '#6B6570', fontSize: 13 }} />
              <YAxis
                tickFormatter={(v: number) => formatCurrency(v)}
                tick={{ fill: '#6B6570', fontSize: 12 }}
                width={90}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 13, color: '#2A2030' }}
              />
              <Bar
                dataKey="jewish"
                name={CATEGORY_LABELS.jewish}
                stackId="giving"
                fill={categoryChartColors.jewish}
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="education"
                name={CATEGORY_LABELS.education}
                stackId="giving"
                fill={categoryChartColors.education}
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="arts"
                name={CATEGORY_LABELS.arts}
                stackId="giving"
                fill={categoryChartColors.arts}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Section 3: Category Breakdown by Year (table) */}
      <div className="bg-white rounded-xl border border-card-border shadow-[0_1px_4px_rgba(150,99,176,0.08)] overflow-hidden">
        <div className="px-5 py-3 border-b border-card-border">
          <h2 className="text-[18px] font-semibold text-purple-dark">Category Breakdown by Year</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="bg-purple-light text-left">
                <th className="px-5 py-3 font-semibold text-purple-dark">Year</th>
                <th className="px-5 py-3 font-semibold text-purple-dark">{CATEGORY_LABELS.jewish}</th>
                <th className="px-5 py-3 font-semibold text-purple-dark">{CATEGORY_LABELS.education}</th>
                <th className="px-5 py-3 font-semibold text-purple-dark">{CATEGORY_LABELS.arts}</th>
                <th className="px-5 py-3 font-semibold text-purple-dark text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, idx) => (
                <tr
                  key={row.year}
                  className={idx % 2 === 0 ? 'bg-white' : 'bg-warm-gray-lt'}
                >
                  <td className="px-5 py-3 font-medium text-text-dark">{row.year}</td>
                  <td className="px-5 py-3 text-text-dark">{formatCurrency(row.jewish)}</td>
                  <td className="px-5 py-3 text-text-dark">{formatCurrency(row.education)}</td>
                  <td className="px-5 py-3 text-text-dark">{formatCurrency(row.arts)}</td>
                  <td className="px-5 py-3 text-text-dark font-semibold text-right">
                    {formatCurrency(row.total)}
                  </td>
                </tr>
              ))}
              {/* Totals row */}
              <tr className="bg-purple-light font-semibold">
                <td className="px-5 py-3 text-purple-dark">All Years</td>
                <td className="px-5 py-3 text-purple-dark">
                  {formatCurrency(tableRows.reduce((s, r) => s + r.jewish, 0))}
                </td>
                <td className="px-5 py-3 text-purple-dark">
                  {formatCurrency(tableRows.reduce((s, r) => s + r.education, 0))}
                </td>
                <td className="px-5 py-3 text-purple-dark">
                  {formatCurrency(tableRows.reduce((s, r) => s + r.arts, 0))}
                </td>
                <td className="px-5 py-3 text-purple-dark text-right">
                  {formatCurrency(totalGiving)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 4: Grant Type Distribution */}
      <div className="bg-white rounded-xl border border-card-border shadow-[0_1px_4px_rgba(150,99,176,0.08)]">
        <div className="px-5 py-3 border-b border-card-border">
          <h2 className="text-[18px] font-semibold text-purple-dark">Grant Type Distribution</h2>
        </div>
        <div className="grid grid-cols-2 divide-x divide-card-border">
          <div className="p-5 text-center">
            <p className="text-[12px] font-medium text-purple-dark uppercase tracking-wide mb-2">
              Multi-Year
            </p>
            <p className="text-[28px] font-semibold text-purple leading-tight">
              {formatCurrency(grantTypeStats.multiYear.total)}
            </p>
            <p className="text-[13px] text-warm-gray mt-1">
              {grantTypeStats.multiYear.count} grant{grantTypeStats.multiYear.count !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="p-5 text-center">
            <p className="text-[12px] font-medium text-gold-dark uppercase tracking-wide mb-2">
              Annual
            </p>
            <p className="text-[28px] font-semibold text-gold-dark leading-tight">
              {formatCurrency(grantTypeStats.annual.total)}
            </p>
            <p className="text-[13px] text-warm-gray mt-1">
              {grantTypeStats.annual.count} grant{grantTypeStats.annual.count !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
