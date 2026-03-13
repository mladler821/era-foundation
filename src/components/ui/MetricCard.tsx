interface MetricCardProps {
  label: string;
  value: string;
  sublabel?: string;
  className?: string;
}

export default function MetricCard({ label, value, sublabel, className = '' }: MetricCardProps) {
  return (
    <div className={`bg-white rounded-xl border border-card-border p-4 shadow-[0_1px_4px_rgba(150,99,176,0.08)] ${className}`}>
      <p className="text-[13px] text-warm-gray font-normal mb-1">{label}</p>
      <p className="text-[28px] font-semibold text-purple leading-tight">{value}</p>
      {sublabel && <p className="text-[12px] text-warm-gray mt-1">{sublabel}</p>}
    </div>
  );
}
