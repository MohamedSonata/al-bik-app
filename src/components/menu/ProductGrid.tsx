import { motion, AnimatePresence } from 'framer-motion';
import { useMenuData } from '@/context/MenuDataContext';
import { ProductCard } from './ProductCard';
import { ProductGridSkeleton } from '@/components/ui/shimmer';
import { ErrorState } from './ErrorState';
import { useTranslation } from 'react-i18next';

export function ProductGrid() {
  const { products, productsLoading, initialLoading, status, error, retry } = useMenuData();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  /* Show shimmer during initial load or when switching categories */
  if (initialLoading || productsLoading) {
    return <ProductGridSkeleton />;
  }

  /* Show error state if connection failed */
  if (status === 'error' && error) {
    return <ErrorState onRetry={retry} message={error} />;
  }

  return (
    <div className="container mx-auto px-4 py-12 min-h-[500px]">
      <motion.div
        layout
        className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
      >
        <AnimatePresence mode="popLayout">
          {products.map((product) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.3 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {!productsLoading && products.length === 0 && (
        <div className="text-center py-20 font-body" style={{ color: 'hsl(40,20%,45%)' }}>
          {isAr ? 'لا توجد منتجات في هذا القسم.' : 'No products found in this category.'}
        </div>
      )}
    </div>
  );
}
