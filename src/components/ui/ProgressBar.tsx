interface ProgressBarProps {
  percentage: number;
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

export default function ProgressBar({ percentage, label, showPercentage = true, className = '' }: ProgressBarProps) {
  const clamped = Math.min(Math.max(percentage, 0), 100);

  // WHY: Color indicates compliance pace — purple=on track, amber=slightly behind, green=met
  let barColor = 'bg-purple';
  if (clamped >= 100) barColor = 'bg-green-600';
  else if (clamped < 90 * (new Date().getMonth() + 1) / 12) barColor = 'bg-amber-500';

  return (
    <div className={className}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-[13px] font-medium text-purple-dark">{label}</span>}
          {showPercentage && <span className="text-[13px] font-semibold text-purple-dark">{clamped.toFixed(1)}%</span>}
        </div>
      )}
      <div className="w-full h-3 bg-warm-gray-lt rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
