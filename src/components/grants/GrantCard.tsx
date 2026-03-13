import { CheckCircle } from 'lucide-react';
import CategoryBadge from '../ui/CategoryBadge';
import type { Grant } from '../../types';

/** Status badge colors — paid/acknowledged don't show a badge (they get a checkmark instead) */
const STATUS_STYLES: Record<string, string> = {
  considering: 'bg-amber-100 text-amber-700',
  committed: 'bg-blue-100 text-blue-700',
};

/** Grant type badge — distinguishes annual vs multi-year at a glance */
const TYPE_STYLES: Record<string, string> = {
  annual: 'bg-gold-light text-gold-dark',
  'multi-year': 'bg-purple-light text-purple-dark',
};

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

interface GrantCardProps {
  grant: Grant;
  onEdit: (grant: Grant) => void;
}

export default function GrantCard({ grant, onEdit }: GrantCardProps) {
  const isPaidOrAcknowledged = grant.status === 'paid' || grant.status === 'acknowledged';
  const isMultiYear = grant.grantType === 'multi-year';

  const multiYearProgress =
    isMultiYear && grant.commitmentTotalYears
      ? ((grant.commitmentYear ?? 1) / grant.commitmentTotalYears) * 100
      : 0;

  return (
    <button
      type="button"
      onClick={() => onEdit(grant)}
      className="w-full text-left bg-white rounded-xl border border-card-border p-4 shadow-[0_1px_4px_rgba(150,99,176,0.08)] hover:border-purple/40 hover:shadow-md transition-all min-h-[44px] cursor-pointer"
    >
      {/* Top row: checkmark + org name + amount + date */}
      <div className="flex items-start gap-3">
        {isPaidOrAcknowledged && (
          <CheckCircle size={20} className="text-green-600 mt-0.5 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[14px] font-semibold text-text-dark truncate">{grant.granteeName}</p>
            <div className="text-right shrink-0">
              <p className="text-[16px] font-semibold text-purple-dark">{formatCurrency(grant.amount)}</p>
              {grant.paymentDate && (
                <p className="text-[12px] text-warm-gray">{formatDate(grant.paymentDate)}</p>
              )}
            </div>
          </div>

          {/* Purpose line */}
          {grant.purpose && (
            <p className="text-[13px] text-warm-gray mt-0.5 truncate">{grant.purpose}</p>
          )}

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <CategoryBadge category={grant.category} />
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium ${TYPE_STYLES[grant.grantType]}`}>
              {grant.grantType === 'multi-year' ? 'Multi-Year' : 'Annual'}
            </span>
            {!isPaidOrAcknowledged && STATUS_STYLES[grant.status] && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium ${STATUS_STYLES[grant.status]}`}>
                {grant.status.charAt(0).toUpperCase() + grant.status.slice(1)}
              </span>
            )}
          </div>

          {/* Multi-year progress bar */}
          {isMultiYear && grant.commitmentTotalYears && grant.commitmentTotalPledge && (
            <div className="mt-3">
              <div className="flex justify-between text-[12px] text-warm-gray mb-1">
                <span>Pledge: {formatCurrency(grant.commitmentTotalPledge)} total</span>
                <span>Year {grant.commitmentYear ?? 1} of {grant.commitmentTotalYears}</span>
              </div>
              <div className="w-full h-2 bg-warm-gray-lt rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-purple transition-all duration-500"
                  style={{ width: `${Math.min(multiYearProgress, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
