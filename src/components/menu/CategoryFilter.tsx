import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useMenuData } from '@/context/MenuDataContext';
import { CategorySkeleton } from '@/components/ui/shimmer';

export function CategoryFilter() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { categories, activeCategory, selectCategory, initialLoading } = useMenuData();

  return (
    <div className="sticky top-16 z-40 bg-brand-charcoal/95 backdrop-blur-md border-b border-brand-gold/20 py-4 shadow-lg shadow-black/50">
      <div className="container mx-auto px-4">
        {initialLoading ? (
          <CategorySkeleton />
        ) : (
          <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2">
            {categories.map((category) => {
              const isActive = activeCategory === category.slug;
              const label = isAr ? category.labelAr : category.labelEn;
              return (
                <button
                  key={category.slug}
                  onClick={() => selectCategory(category.slug)}
                  className={cn(
                    'relative px-6 py-2 rounded-full font-body font-bold uppercase tracking-wider whitespace-nowrap transition-colors',
                    isActive
                      ? 'text-brand-gold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-brand-surface',
                  )}
                  data-testid={`filter-${category.slug}`}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {category.icon && <span>{category.icon}</span>}
                    <span>{label}</span>
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute inset-0 border-b-2 border-brand-gold bg-brand-gold/10 rounded-full"
                      initial={false}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
