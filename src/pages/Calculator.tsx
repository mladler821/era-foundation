import { useState, useMemo, useCallback } from 'react';
import { useYear } from '../hooks/useYear';
import { useGrants } from '../hooks/useGrants';
import { useFMV } from '../hooks/useFMV';
import MetricCard from '../components/ui/MetricCard';
import ProgressBar from '../components/ui/ProgressBar';
import type { FMVEntry } from '../types';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// WHY: 5% is the IRS-mandated minimum distribution for private foundations
const REQUIRED_RATE = 0.05;

// WHY: 7% is a commonly used long-term average return assumption for diversified portfolios
const DEFAULT_GROWTH_RATE = 7;

// WHY: 2035 chosen as a 10-year projection horizon from mid-2020s, giving a useful planning window
const PROJECTION_END_YEAR = 2035;

type Tab = 'monthly' | 'projection' | 'quick';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Parses a currency-formatted string back to a number, stripping non-numeric chars except decimals */
function parseCurrencyInput(raw: string): number {
  const cleaned = raw.replace(/[^0-9.]/g, '');
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
}

/** Determines compliance status based on grants vs required distribution */
function getStatus(required: number, granted: number): { label: string; color: string } {
  if (required <= 0) return { label: 'No FMV Data', color: 'bg-warm-gray text-white' };
  const pct = granted / required;
  if (pct >= 1) return { label: 'Met', color: 'bg-green-600 text-white' };
  // WHY: "On Pace" if grants-to-date are proportionally ahead of the calendar year progress
  const yearProgress = (new Date().getMonth() + 1) / 12;
  if (pct >= yearProgress * 0.9) return { label: 'On Pace', color: 'bg-purple text-white' };
  return { label: 'Behind', color: 'bg-amber-500 text-white' };
}

// ---------------------------------------------------------------------------
// Status Block — shared between tabs
// ---------------------------------------------------------------------------

interface StatusBlockProps {
  avgFMV: number;
  required: number;
  grantsToDate: number;
}

function StatusBlock({ avgFMV, required, grantsToDate }: StatusBlockProps) {
  const surplus = grantsToDate - required;
  const status = getStatus(required, grantsToDate);
  const pct = required > 0 ? (grantsToDate / required) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Avg Monthly FMV" value={formatCurrency(avgFMV)} />
        <MetricCard label="Required 5%" value={formatCurrency(required)} />
        <MetricCard label="Grants to Date" value={formatCurrency(grantsToDate)} />
        <MetricCard
          label="Surplus / Shortfall"
          value={formatCurrency(Math.abs(surplus))}
          sublabel={surplus >= 0 ? 'Surplus' : 'Shortfall'}
        />
      </div>
      <div className="flex items-center gap-3">
        <ProgressBar percentage={pct} label="Distribution Progress" className="flex-1" />
        <span className={`text-[13px] font-semibold px-3 py-1 rounded-full whitespace-nowrap ${status.color}`}>
          {status.label}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 1: Monthly FMV
// ---------------------------------------------------------------------------

interface MonthlyFMVTabProps {
  fmvEntries: FMVEntry[];
  updateFMV: (entries: FMVEntry[]) => Promise<void>;
  averageFMV: number;
  requiredDistribution: number;
  grantsToDate: number;
}

function MonthlyFMVTab({ fmvEntries, updateFMV, averageFMV, requiredDistribution, grantsToDate }: MonthlyFMVTabProps) {
  // Build a lookup from month index (0-11) to value for quick access
  const valueByMonth = useMemo(() => {
    const map = new Map<number, number>();
    for (const entry of fmvEntries) {
      map.set(entry.month, entry.value);
    }
    return map;
  }, [fmvEntries]);

  const monthsEntered = useMemo(
    () => fmvEntries.filter((e) => e.value > 0).length,
    [fmvEntries],
  );

  const handleMonthChange = useCallback(
    (month: number, raw: string) => {
      const value = parseCurrencyInput(raw);
      // Build a new array with all 12 months, preserving existing values
      const updated: FMVEntry[] = MONTH_NAMES.map((_, i) => ({
        month: i,
        value: i === month ? value : (valueByMonth.get(i) ?? 0),
      }));
      void updateFMV(updated);
    },
    [updateFMV, valueByMonth],
  );

  return (
    <div className="space-y-6">
      <StatusBlock avgFMV={averageFMV} required={requiredDistribution} grantsToDate={grantsToDate} />

      <div className="bg-white rounded-xl border border-card-border shadow-[0_1px_4px_rgba(150,99,176,0.08)]">
        <div className="px-5 py-3 border-b border-card-border flex items-center justify-between">
          <h2 className="text-[18px] font-semibold text-purple-dark">Monthly FMV Entry</h2>
          <span className="text-[13px] text-warm-gray">{monthsEntered} of 12 months entered</span>
        </div>

        <div className="divide-y divide-card-border">
          {MONTH_NAMES.map((name, i) => (
            <div key={i} className={`px-5 py-3 flex items-center justify-between gap-4 ${i % 2 === 1 ? 'bg-warm-gray-lt' : 'bg-white'}`}>
              <label htmlFor={`fmv-month-${i}`} className="text-[14px] font-medium text-text-dark w-28 shrink-0">
                {name}
              </label>
              <div className="relative flex-1 max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray text-[14px]">$</span>
                <input
                  id={`fmv-month-${i}`}
                  type="text"
                  inputMode="numeric"
                  className="w-full min-h-[44px] pl-7 pr-3 py-2 border border-card-border rounded-lg text-[14px] text-text-dark
                             focus:outline-none focus:ring-2 focus:ring-purple focus:border-purple transition"
                  placeholder="0"
                  defaultValue={valueByMonth.get(i) ? valueByMonth.get(i)!.toLocaleString() : ''}
                  key={`${i}-${valueByMonth.get(i) ?? ''}`}
                  onBlur={(e) => handleMonthChange(i, e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2: Projection
// ---------------------------------------------------------------------------

interface ProjectionRow {
  year: number;
  openingFMV: number;
  contribution: number;
  growth: number;
  required5: number;
  endingFMV: number;
}

interface ProjectionTabProps {
  defaultStartingFMV: number;
  grantsToDate: number;
}

function ProjectionTab({ defaultStartingFMV, grantsToDate }: ProjectionTabProps) {
  const { selectedYear } = useYear();
  const startYear = parseInt(selectedYear);

  const [startingFMV, setStartingFMV] = useState<string>(defaultStartingFMV > 0 ? defaultStartingFMV.toLocaleString() : '');
  const [annualContributions, setAnnualContributions] = useState<string>('0');
  const [growthRate, setGrowthRate] = useState<string>(String(DEFAULT_GROWTH_RATE));

  const parsedStartingFMV = parseCurrencyInput(startingFMV);
  const parsedContributions = parseCurrencyInput(annualContributions);
  const parsedGrowthRate = parseFloat(growthRate) || 0;

  const rows: ProjectionRow[] = useMemo(() => {
    const result: ProjectionRow[] = [];
    let opening = parsedStartingFMV;

    for (let yr = startYear; yr <= PROJECTION_END_YEAR; yr++) {
      const contribution = parsedContributions;
      const growth = opening * (parsedGrowthRate / 100);
      const required5 = opening * REQUIRED_RATE;
      const ending = opening + contribution + growth - required5;

      result.push({ year: yr, openingFMV: opening, contribution, growth, required5, endingFMV: ending });
      opening = ending;
    }
    return result;
  }, [parsedStartingFMV, parsedContributions, parsedGrowthRate, startYear]);

  const cumulativeRequired = rows.reduce((sum, r) => sum + r.required5, 0);
  const finalEndingFMV = rows.length > 0 ? rows[rows.length - 1].endingFMV : 0;

  // For the status block: use year-1 required (first row)
  const currentRequired = rows.length > 0 ? rows[0].required5 : 0;

  return (
    <div className="space-y-6">
      <StatusBlock avgFMV={parsedStartingFMV} required={currentRequired} grantsToDate={grantsToDate} />

      {/* Inputs */}
      <div className="bg-white rounded-xl border border-card-border p-5 shadow-[0_1px_4px_rgba(150,99,176,0.08)]">
        <h2 className="text-[18px] font-semibold text-purple-dark mb-4">Projection Inputs</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="proj-starting-fmv" className="block text-[13px] font-medium text-purple-dark mb-1">
              Starting FMV
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray text-[14px]">$</span>
              <input
                id="proj-starting-fmv"
                type="text"
                inputMode="numeric"
                className="w-full min-h-[44px] pl-7 pr-3 py-2 border border-card-border rounded-lg text-[14px] text-text-dark
                           focus:outline-none focus:ring-2 focus:ring-purple focus:border-purple transition"
                value={startingFMV}
                onChange={(e) => setStartingFMV(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label htmlFor="proj-contributions" className="block text-[13px] font-medium text-purple-dark mb-1">
              Annual Contributions
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray text-[14px]">$</span>
              <input
                id="proj-contributions"
                type="text"
                inputMode="numeric"
                className="w-full min-h-[44px] pl-7 pr-3 py-2 border border-card-border rounded-lg text-[14px] text-text-dark
                           focus:outline-none focus:ring-2 focus:ring-purple focus:border-purple transition"
                value={annualContributions}
                onChange={(e) => setAnnualContributions(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label htmlFor="proj-growth" className="block text-[13px] font-medium text-purple-dark mb-1">
              Growth Rate
            </label>
            <div className="relative">
              <input
                id="proj-growth"
                type="text"
                inputMode="decimal"
                className="w-full min-h-[44px] pl-3 pr-8 py-2 border border-card-border rounded-lg text-[14px] text-text-dark
                           focus:outline-none focus:ring-2 focus:ring-purple focus:border-purple transition"
                value={growthRate}
                onChange={(e) => setGrowthRate(e.target.value)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-gray text-[14px]">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Projection Table */}
      <div className="bg-white rounded-xl border border-card-border shadow-[0_1px_4px_rgba(150,99,176,0.08)] overflow-x-auto">
        <table className="w-full text-[14px]">
          <thead>
            <tr className="bg-purple-light text-purple-dark text-left">
              <th className="px-4 py-3 font-semibold">Year</th>
              <th className="px-4 py-3 font-semibold text-right">Opening FMV</th>
              <th className="px-4 py-3 font-semibold text-right">Contribution</th>
              <th className="px-4 py-3 font-semibold text-right">Growth</th>
              <th className="px-4 py-3 font-semibold text-right">Required 5%</th>
              <th className="px-4 py-3 font-semibold text-right">Ending FMV</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.year} className={idx % 2 === 1 ? 'bg-warm-gray-lt' : 'bg-white'}>
                <td className="px-4 py-3 font-medium text-text-dark">{row.year}</td>
                <td className="px-4 py-3 text-right text-text-dark">{formatCurrency(row.openingFMV)}</td>
                <td className="px-4 py-3 text-right text-text-dark">{formatCurrency(row.contribution)}</td>
                <td className="px-4 py-3 text-right text-text-dark">{formatCurrency(row.growth)}</td>
                <td className="px-4 py-3 text-right font-semibold text-purple">{formatCurrency(row.required5)}</td>
                <td className="px-4 py-3 text-right text-text-dark">{formatCurrency(row.endingFMV)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-purple-light font-semibold text-purple-dark border-t-2 border-purple">
              <td className="px-4 py-3" colSpan={4}>Totals</td>
              <td className="px-4 py-3 text-right">{formatCurrency(cumulativeRequired)}</td>
              <td className="px-4 py-3 text-right">{formatCurrency(finalEndingFMV)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 3: Quick Average
// ---------------------------------------------------------------------------

interface QuickAverageTabProps {
  grantsToDate: number;
}

function QuickAverageTab({ grantsToDate }: QuickAverageTabProps) {
  const [fmvInput, setFmvInput] = useState<string>('');
  const parsedFMV = parseCurrencyInput(fmvInput);
  const required = parsedFMV * REQUIRED_RATE;
  const surplus = grantsToDate - required;

  return (
    <div className="space-y-6">
      {/* Single FMV Input */}
      <div className="bg-white rounded-xl border border-card-border p-5 shadow-[0_1px_4px_rgba(150,99,176,0.08)]">
        <h2 className="text-[18px] font-semibold text-purple-dark mb-4">Quick 5% Calculation</h2>
        <div className="max-w-sm">
          <label htmlFor="quick-fmv" className="block text-[13px] font-medium text-purple-dark mb-1">
            Fair Market Value
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray text-[14px]">$</span>
            <input
              id="quick-fmv"
              type="text"
              inputMode="numeric"
              className="w-full min-h-[44px] pl-7 pr-3 py-2 border border-card-border rounded-lg text-[14px] text-text-dark
                         focus:outline-none focus:ring-2 focus:ring-purple focus:border-purple transition"
              placeholder="Enter FMV"
              value={fmvInput}
              onChange={(e) => setFmvInput(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Results */}
      {parsedFMV > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard label="FMV" value={formatCurrency(parsedFMV)} />
            <MetricCard
              label="Required 5%"
              value={formatCurrency(required)}
              sublabel={`${formatCurrency(parsedFMV)} x 5%`}
            />
            <MetricCard label="Grants to Date" value={formatCurrency(grantsToDate)} />
          </div>

          <div className="bg-white rounded-xl border border-card-border p-5 shadow-[0_1px_4px_rgba(150,99,176,0.08)]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[16px] font-semibold text-purple-dark">Comparison</h3>
              <span
                className={`text-[13px] font-semibold px-3 py-1 rounded-full ${
                  surplus >= 0 ? 'bg-green-600 text-white' : 'bg-amber-500 text-white'
                }`}
              >
                {surplus >= 0 ? 'Surplus' : 'Shortfall'}
              </span>
            </div>
            <div className="text-center py-4">
              <p className="text-[13px] text-warm-gray mb-1">
                {formatCurrency(required)} required vs {formatCurrency(grantsToDate)} granted
              </p>
              <p className={`text-[32px] font-bold ${surplus >= 0 ? 'text-green-600' : 'text-amber-500'}`}>
                {surplus >= 0 ? '+' : '-'}{formatCurrency(Math.abs(surplus))}
              </p>
            </div>
            <ProgressBar
              percentage={required > 0 ? (grantsToDate / required) * 100 : 0}
              label="Distribution Progress"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Calculator Page
// ---------------------------------------------------------------------------

const TABS: { key: Tab; label: string }[] = [
  { key: 'monthly', label: 'Monthly FMV' },
  { key: 'projection', label: 'Projection' },
  { key: 'quick', label: 'Quick Average' },
];

export default function Calculator() {
  const [activeTab, setActiveTab] = useState<Tab>('monthly');
  const { selectedYear } = useYear();
  const { grants } = useGrants(selectedYear);
  const { fmvEntries, loading, updateFMV, averageFMV, requiredDistribution } = useFMV(selectedYear);

  const grantsToDate = grants.reduce((sum, g) => sum + g.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-[24px] font-semibold text-purple-dark">5% Calculator</h1>

      {/* Tab bar */}
      <div className="flex gap-1 bg-warm-gray-lt rounded-xl p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 min-h-[44px] px-4 py-2.5 rounded-lg text-[14px] font-medium transition-all
              ${
                activeTab === tab.key
                  ? 'bg-white text-purple-dark shadow-sm'
                  : 'text-warm-gray hover:text-purple-dark'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="bg-white rounded-xl border border-card-border p-8 text-center">
          <p className="text-warm-gray">Loading FMV data...</p>
        </div>
      ) : (
        <>
          {activeTab === 'monthly' && (
            <MonthlyFMVTab
              fmvEntries={fmvEntries}
              updateFMV={updateFMV}
              averageFMV={averageFMV}
              requiredDistribution={requiredDistribution}
              grantsToDate={grantsToDate}
            />
          )}
          {activeTab === 'projection' && (
            <ProjectionTab
              defaultStartingFMV={averageFMV}
              grantsToDate={grantsToDate}
            />
          )}
          {activeTab === 'quick' && (
            <QuickAverageTab grantsToDate={grantsToDate} />
          )}
        </>
      )}
    </div>
  );
}
