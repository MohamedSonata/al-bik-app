import { cn } from '@/lib/utils';

interface ShimmerProps {
  className?: string;
}

export function Shimmer({ className }: ShimmerProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gradient-to-r from-brand-surface via-brand-gold/10 to-brand-surface bg-[length:200%_100%]',
        className
      )}
      style={{
        animation: 'shimmer 2s infinite',
      }}
    />
  );
}

export function CategorySkeleton() {
  return (
    <div className="flex gap-2 overflow-hidden">
      {Array.from({ length: 6 }).map((_, i) => (
        <Shimmer
          key={i}
          className="h-10 rounded-full"
          style={{ width: `${80 + Math.random() * 60}px` }}
        />
      ))}
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-brand-surface rounded-lg overflow-hidden border border-brand-gold/20">
      <Shimmer className="w-full aspect-square" />
      <div className="p-4 space-y-3">
        <Shimmer className="h-5 w-3/4 rounded" />
        <Shimmer className="h-4 w-full rounded" />
        <Shimmer className="h-4 w-2/3 rounded" />
        <div className="flex items-center justify-between pt-2">
          <Shimmer className="h-6 w-20 rounded" />
          <Shimmer className="h-9 w-24 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
