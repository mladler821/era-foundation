import { CATEGORY_LABELS } from '../../types';
import type { Category } from '../../types';

const BADGE_STYLES: Record<Category, string> = {
  jewish: 'bg-purple-light text-purple-dark',
  education: 'bg-gold-light text-gold-dark',
  arts: 'bg-warm-gray-lt text-warm-gray',
};

interface CategoryBadgeProps {
  category: Category;
  className?: string;
}

export default function CategoryBadge({ category, className = '' }: CategoryBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium ${BADGE_STYLES[category]} ${className}`}>
      {CATEGORY_LABELS[category]}
    </span>
  );
}
