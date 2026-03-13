import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="text-warm-gray mb-3">{icon}</div>}
      <h3 className="text-[16px] font-semibold text-text-dark mb-1">{title}</h3>
      {description && <p className="text-[13px] text-warm-gray max-w-[300px]">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
