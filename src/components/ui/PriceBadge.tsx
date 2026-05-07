import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface PriceBadgeProps {
  price: number;
  className?: string;
}

export function PriceBadge({ price, className }: PriceBadgeProps) {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center px-4 py-2 font-price text-2xl font-bold tracking-wider text-white bg-gradient-to-r from-brand-crimson to-red-600 border-2 border-brand-gold/50 rounded-lg shadow-lg shadow-brand-crimson/30",
        className
      )}
      data-testid={`price-badge-${price}`}
    >
      <span className="mr-1.5 text-base font-normal">{t('menu.sar')}</span>
      {price}
    </span>
  );
}