import { cn } from '@/lib/utils';

interface CategoryPillProps {
  label: string;
  variant?: 'gold' | 'red';
  className?: string;
}

export function CategoryPill({ label, variant = 'gold', className }: CategoryPillProps) {
  return (
    <span
      className={cn(
        "inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full",
        variant === 'gold' && "bg-brand-gold/20 text-brand-gold border border-brand-gold/50",
        variant === 'red' && "bg-brand-crimson/20 text-brand-crimson border border-brand-crimson/50",
        className
      )}
      data-testid={`category-pill-${label}`}
    >
      {label}
    </span>
  );
}