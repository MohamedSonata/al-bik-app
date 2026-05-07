import { motion, AnimatePresence } from 'framer-motion';
import { useMenuData } from '@/context/MenuDataContext';
import { ProductCard } from './ProductCard';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function ProductGrid() {
  const { products, productsLoading } = useMenuData();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  if (productsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2
          className="w-10 h-10 animate-spin"
          style={{ color: 'hsl(43,100%,52%)' }}
        />
        <p className="font-body text-sm uppercase tracking-widest" style={{ color: 'hsl(40,20%,45%)' }}>
          {isAr ? 'جارٍ تحميل المنتجات...' : 'Loading products...'}
        </p>
      </div>
    );
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
