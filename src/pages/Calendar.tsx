import { useMemo } from 'react';
import { CheckCircle, CalendarClock, AlertTriangle } from 'lucide-react';
import CategoryBadge from '../components/ui/CategoryBadge';
import YearSelector from '../components/layout/YearSelector';
import { useYear } from '../hooks/useYear';
import { useGrants } from '../hooks/useGrants';
import { useCommitments } from '../hooks/useCommitments';
import { useFMV } from '../hooks/useFMV';
import { CATEGORY_COLORS } from '../types';
import type { Grant, Commitment, Category } from '../types';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00'); // WHY: Appending time avoids timezone-shift issues with date-only strings
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Map month number (0-11) to human-readable name */
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Status badge colors — mirrors GrantCard pattern */
const STATUS_STYLES: Record<string, { bg: string; label: string }> = {
  considering: { bg: 'bg-amber-100 text-amber-700', label: 'Considering' },
  committed: { bg: 'bg-blue-100 text-blue-700', label: 'Committed' },
  paid: { bg: 'bg-green-100 text-green-700', label: 'Paid' },
  acknowledged: { bg: 'bg-green-100 text-green-700', label: 'Acknowledged' },
};

// WHY: 30 days is the standard "upcoming" threshold for payment reminders in nonprofit management
const UPCOMING_DAYS_THRESHOLD = 30;

// WHY: 12 months in a year — used for linear pace calculation
const MONTHS_IN_YEAR = 12;

/** Category color mapping for commitment timeline bars */
const COMMITMENT_BAR_COLORS: Record<Category, { filled: string; outlined: string }> = {
  jewish: { filled: 'bg-purple', outlined: 'border-2 border-purple bg-purple-light' },
  education: { filled: 'bg-gold', outlined: 'border-2 border-gold bg-gold-light' },
  arts: { filled: 'bg-warm-gray', outlined: 'border-2 border-warm-gray bg-warm-gray-lt' },
};

interface MonthGroup {
  month: number;
  grants: Grant[];
}

function groupGrantsByMonth(grants: Grant[]): MonthGroup[] {
  const sorted = [...grants].sort((a, b) => a.paymentDate.localeCompare(b.paymentDate));
  const groups: Map<number, Grant[]> = new Map();

  for (const grant of sorted) {
    if (!grant.paymentDate) continue;
    const date = new Date(grant.paymentDate + 'T00:00:00');
    const month = date.getMonth();
    if (!groups.has(month)) {
      groups.set(month, []);
    }
    groups.get(month)!.push(grant);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a - b)
    .map(([month, g]) => ({ month, grants: g }));
}

/** Check if a grant has a payment date within the next N days from today */
function isUpcomingPayment(paymentDate: string, daysThreshold: number): boolean {
  if (!paymentDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const payment = new Date(paymentDate + 'T00:00:00');
  const diffMs = payment.getTime() - today.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24); // ms per day
  return diffDays >= 0 && diffDays <= daysThreshold;
}

// ---------------------------------------------------------------------------
// Active Alerts Section
// ---------------------------------------------------------------------------

interface AlertItem {
  type: 'success' | 'info' | 'warning';
  message: string;
}

function AlertIcon({ type }: { type: AlertItem['type'] }) {
  switch (type) {
    case 'success':
      return <CheckCircle size={20} className="text-green-600 shrink-0" />;
    case 'info':
      return <CalendarClock size={20} className="text-blue-600 shrink-0" />;
    case 'warning':
      return <AlertTriangle size={20} className="text-amber-600 shrink-0" />;
  }
}

const ALERT_BG: Record<AlertItem['type'], string> = {
  success: 'bg-green-50 border-green-200',
  info: 'bg-blue-50 border-blue-200',
  warning: 'bg-amber-50 border-amber-200',
};

function ActiveAlerts({ alerts }: { alerts: AlertItem[] }) {
  if (alerts.length === 0) return null;
  return (
    <div className="bg-white rounded-xl border border-card-border shadow-[0_1px_4px_rgba(150,99,176,0.08)]">
      <div className="px-5 py-3 border-b border-card-border">
        <h2 className="text-[18px] font-semibold text-purple-dark">Active Alerts</h2>
      </div>
      <div className="p-4 space-y-3">
        {alerts.map((alert, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 min-h-[44px] ${ALERT_BG[alert.type]}`}
          >
            <AlertIcon type={alert.type} />
            <span className="text-[14px] font-medium text-text-dark">{alert.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Payment Schedule Section
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status];
  if (!style) return null;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium ${style.bg}`}>
      {style.label}
    </span>
  );
}

function PaymentSchedule({ monthGroups, selectedYear }: { monthGroups: MonthGroup[]; selectedYear: string }) {
  if (monthGroups.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-card-border shadow-[0_1px_4px_rgba(150,99,176,0.08)]">
        <div className="px-5 py-3 border-b border-card-border">
          <h2 className="text-[18px] font-semibold text-purple-dark">{selectedYear} Payment Schedule</h2>
        </div>
        <p className="px-5 py-8 text-center text-[14px] text-warm-gray">No grants with payment dates this year</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-card-border shadow-[0_1px_4px_rgba(150,99,176,0.08)]">
      <div className="px-5 py-3 border-b border-card-border">
        <h2 className="text-[18px] font-semibold text-purple-dark">{selectedYear} Payment Schedule</h2>
      </div>
      <div className="divide-y divide-card-border">
        {monthGroups.map(({ month, grants }) => (
          <div key={month}>
            {/* Month header */}
            <div className="px-5 py-2 bg-warm-gray-lt/50">
              <h3 className="text-[13px] font-semibold text-purple-dark uppercase tracking-wide">
                {MONTH_NAMES[month]}
              </h3>
            </div>
            {/* Grant rows */}
            <div className="divide-y divide-card-border/50">
              {grants.map((grant) => (
                <div
                  key={grant.id}
                  className="px-5 py-3 flex items-center gap-3 min-h-[44px]"
                >
                  {/* Date */}
                  <span className="text-[13px] text-warm-gray w-[90px] shrink-0">
                    {formatDate(grant.paymentDate)}
                  </span>

                  {/* Grantee name */}
                  <span className="text-[14px] font-medium text-text-dark flex-1 min-w-0 truncate">
                    {grant.granteeName}
                  </span>

                  {/* Amount */}
                  <span className="text-[14px] font-semibold text-purple-dark shrink-0">
                    {formatCurrency(grant.amount)}
                  </span>

                  {/* Category badge — hidden on very small screens */}
                  <span className="hidden sm:inline-flex shrink-0">
                    <CategoryBadge category={grant.category} />
                  </span>

                  {/* Status badge */}
                  <span className="shrink-0">
                    <StatusBadge status={grant.status} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Multi-Year Commitment Schedule Section
// ---------------------------------------------------------------------------

interface CommitmentDisplay extends Commitment {
  yearsPaid: number;
  yearsRemaining: number;
  remainingBalance: number;
}

function CommitmentTimeline({ commitment, selectedYearNum }: { commitment: CommitmentDisplay; selectedYearNum: number }) {
  const { startYear, totalYears, annualPayment, totalPledge, granteeName, category, yearsPaid, yearsRemaining, remainingBalance, grantIds } = commitment;
  const endYear = startYear + totalYears - 1;
  const barColors = COMMITMENT_BAR_COLORS[category];
  const dotColor = CATEGORY_COLORS[category].dot;

  const years = Array.from({ length: totalYears }, (_, i) => startYear + i);

  return (
    <div className="px-5 py-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`} />
            <p className="text-[14px] font-semibold text-text-dark truncate">{granteeName}</p>
          </div>
          <p className="text-[12px] text-warm-gray ml-[18px]">
            {formatCurrency(annualPayment)}/yr &middot; {totalYears} year{totalYears !== 1 ? 's' : ''} ({startYear}&ndash;{endYear})
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[16px] font-semibold text-purple">{formatCurrency(totalPledge)}</p>
          <CategoryBadge category={category} />
        </div>
      </div>

      {/* Year timeline bar */}
      <div className="flex gap-1.5 mb-2">
        {years.map((yr) => {
          // WHY: A year is "paid" if a grantId exists for it in the commitment's grantIds map,
          // OR if it's before the selected year (assumed paid for past years).
          const isPaid = grantIds[yr] != null || yr < selectedYearNum;
          const isCurrent = yr === selectedYearNum;

          return (
            <div
              key={yr}
              className={`flex-1 h-7 rounded-md flex items-center justify-center text-[11px] font-medium transition-all ${
                isPaid
                  ? `${barColors.filled} text-white`
                  : `${barColors.outlined} ${isCurrent ? 'ring-2 ring-offset-1 ring-purple/30' : ''}`
              }`}
              title={`${yr}${isPaid ? ' — Paid' : isCurrent ? ' — Current' : ' — Future'}`}
            >
              {/* Show abbreviated year for readability */}
              {yr.toString().slice(-2)}
            </div>
          );
        })}
      </div>

      {/* Summary stats */}
      <div className="flex justify-between text-[12px] text-warm-gray ml-[18px]">
        <span>
          {yearsPaid} of {totalYears} year{totalYears !== 1 ? 's' : ''} paid
        </span>
        <span>
          {yearsRemaining > 0
            ? `${formatCurrency(remainingBalance)} remaining`
            : 'Fully paid'}
        </span>
      </div>
    </div>
  );
}

function CommitmentSchedule({ commitments, selectedYearNum }: { commitments: CommitmentDisplay[]; selectedYearNum: number }) {
  if (commitments.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-card-border shadow-[0_1px_4px_rgba(150,99,176,0.08)]">
        <div className="px-5 py-3 border-b border-card-border">
          <h2 className="text-[18px] font-semibold text-purple-dark">Multi-Year Commitment Schedule</h2>
        </div>
        <p className="px-5 py-8 text-center text-[14px] text-warm-gray">No active multi-year commitments</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-card-border shadow-[0_1px_4px_rgba(150,99,176,0.08)]">
      <div className="px-5 py-3 border-b border-card-border">
        <h2 className="text-[18px] font-semibold text-purple-dark">Multi-Year Commitment Schedule</h2>
      </div>
      <div className="divide-y divide-card-border">
        {commitments.map((c) => (
          <CommitmentTimeline key={c.id} commitment={c} selectedYearNum={selectedYearNum} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Calendar Page
// ---------------------------------------------------------------------------

export default function Calendar() {
  const { selectedYear } = useYear();
  const { grants, loading: grantsLoading } = useGrants(selectedYear);
  const { commitments, loading: commitmentsLoading } = useCommitments();
  const { requiredDistribution } = useFMV(selectedYear);

  const selectedYearNum = parseInt(selectedYear);

  // Compute grants grouped by month for the payment schedule
  const monthGroups = useMemo(() => groupGrantsByMonth(grants), [grants]);

  // Compute commitment display data
  const commitmentDisplays = useMemo<CommitmentDisplay[]>(() => {
    return commitments.map((c) => {
      const yearsPaid = Math.max(0, selectedYearNum - c.startYear + 1);
      const yearsRemaining = Math.max(0, c.totalYears - yearsPaid);
      const remainingBalance = yearsRemaining * c.annualPayment;
      return { ...c, yearsPaid, yearsRemaining, remainingBalance };
    });
  }, [commitments, selectedYearNum]);

  // Build active alerts based on real data
  const alerts = useMemo<AlertItem[]>(() => {
    const result: AlertItem[] = [];

    // 1. Check 5% distribution requirement
    const totalGranted = grants.reduce((sum, g) => sum + g.amount, 0);
    if (requiredDistribution > 0 && totalGranted >= requiredDistribution) {
      result.push({
        type: 'success',
        message: '5% distribution requirement met',
      });
    }

    // 2. Check for upcoming multi-year payments within 30 days
    const upcomingMultiYear = grants.filter(
      (g) =>
        g.grantType === 'multi-year' &&
        g.status !== 'paid' &&
        g.status !== 'acknowledged' &&
        isUpcomingPayment(g.paymentDate, UPCOMING_DAYS_THRESHOLD)
    );
    if (upcomingMultiYear.length > 0) {
      result.push({
        type: 'info',
        message: `${upcomingMultiYear.length} upcoming multi-year payment${upcomingMultiYear.length !== 1 ? 's' : ''} due within 30 days`,
      });
    }

    // 3. Check if behind pace on distributions
    // WHY: Linear pace means by month M, you should have distributed (M/12) of the annual requirement.
    // Using current month index (1-based) since January contributions count toward month 1.
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // 1-based month
    if (requiredDistribution > 0) {
      const expectedPace = (currentMonth / MONTHS_IN_YEAR) * requiredDistribution;
      if (totalGranted < expectedPace) {
        result.push({
          type: 'warning',
          message: `Behind pace on distributions — ${formatCurrency(totalGranted)} of ${formatCurrency(Math.round(expectedPace))} expected by ${MONTH_NAMES[currentMonth - 1]}`,
        });
      }
    }

    return result;
  }, [grants, requiredDistribution]);

  const isLoading = grantsLoading || commitmentsLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[24px] font-semibold text-purple-dark">Calendar & Reminders</h1>
        <YearSelector />
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-card-border p-12 text-center">
          <p className="text-[14px] text-warm-gray">Loading calendar data...</p>
        </div>
      ) : (
        <>
          {/* Section 1: Active Alerts */}
          <ActiveAlerts alerts={alerts} />

          {/* Section 2: Payment Schedule */}
          <PaymentSchedule monthGroups={monthGroups} selectedYear={selectedYear} />

          {/* Section 3: Multi-Year Commitment Schedule */}
          <CommitmentSchedule commitments={commitmentDisplays} selectedYearNum={selectedYearNum} />
        </>
      )}
    </div>
  );
}
