import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Check } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { CategoryPill } from '@/components/ui/CategoryPill';
import { PriceBadge } from '@/components/ui/PriceBadge';
import { Product } from '@/data/products';
import { categories } from '@/data/categories';
import { ProductModal } from './ProductModal';
import { useCartStore } from '@/stores/cart.store';
import { useToast } from '@/hooks/use-toast';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [modalOpen, setModalOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const { addItem } = useCartStore();
  const { toast } = useToast();

  const category = categories.find(c => c.slug === product.category);
  const defaultImage = '/images/cat-general.png';
  const imageUrl = imgError || !product.imageUrl ? defaultImage : product.imageUrl;
  
  const hasDiscount = product.discountPercentage && product.discountPercentage > 0;
  const displayPrice = hasDiscount && product.discountedPrice ? product.discountedPrice : product.price;

  const [isAdding, setIsAdding] = useState(false);

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the modal
    
    if (isAdding) return; // Prevent double clicks
    
    setIsAdding(true);
    
    try {
      // Convert Product to MenuProduct format for cart
      const menuProduct = {
        id: product.id,
        name: isAr ? product.nameAr : product.nameEn,
        price: product.price,
        discountedPrice: product.discountedPrice,
        category: product.category,
        imageUrl: product.imageUrl,
        available: true
      };
      
      addItem(menuProduct, 1, [], undefined);
      
      toast({
        title: t('cart.itemAdded'),
        description: `${isAr ? product.nameAr : product.nameEn}`,
        duration: 2000,
      });
      
      // Brief delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 600));
    } catch (error) {
      toast({
        title: t('cart.error'),
        description: t('cart.addError'),
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <>
      <motion.div
        onClick={() => setModalOpen(true)}
        className="group relative flex flex-col bg-brand-surface border border-brand-gold/10 rounded-xl overflow-hidden cursor-pointer h-full"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
        data-testid={`product-card-${product.id}`}
      >
        <div className="absolute inset-0 group-hover:shadow-[0_0_20px_rgba(220,38,38,0.2)] group-hover:border-brand-gold/50 transition-all duration-300 z-0 pointer-events-none rounded-xl" />
        
        <div className="relative z-10 w-full">
          <AspectRatio ratio={4 / 3}>
            <img 
              src={imageUrl} 
              alt={isAr ? product.nameAr : product.nameEn}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              onError={() => setImgError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-surface via-transparent to-transparent opacity-80" />
            <div className="absolute top-2 left-2">
              <CategoryPill label={isAr ? category?.labelAr || '' : category?.labelEn || ''} variant="red" />
            </div>
            {hasDiscount && (
              <div className="absolute top-2 right-2 bg-brand-crimson text-white px-2 py-1 rounded-md text-xs md:text-sm font-bold shadow-lg">
                -{product.discountPercentage}%
              </div>
            )}
          </AspectRatio>
        </div>

        <div className="flex flex-col flex-1 p-3 md:p-4 relative z-10">
          <h3 className="font-heading text-base md:text-lg font-bold text-brand-gold mb-1 line-clamp-1">
            {isAr ? product.nameAr : product.nameEn}
          </h3>
          <p className="text-[10px] md:text-xs text-muted-foreground mb-2 font-body line-clamp-1">
            {!isAr ? product.nameAr : product.nameEn}
          </p>
          
          <p className="text-foreground/70 text-xs md:text-sm font-body line-clamp-2 mb-3 md:mb-4 flex-1">
            {isAr ? product.descriptionAr : product.descriptionEn}
          </p>

          <div className="flex items-center justify-between mt-auto gap-2">
            <div className="flex flex-col gap-1">
              {hasDiscount && (
                <span className="text-xs text-muted-foreground line-through">
                  {product.price} {isAr ? 'دأ' : 'SAR'}
                </span>
              )}
              <PriceBadge price={displayPrice} className="text-lg md:text-xl px-3 py-1.5" />
            </div>
            
            {/* Enhanced Add to Cart Button */}
            <motion.button
              onClick={handleQuickAdd}
              disabled={isAdding}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-brand-crimson to-brand-crimson/80 border-2 border-brand-gold/30 flex items-center justify-center text-white shadow-lg hover:shadow-xl hover:shadow-brand-crimson/50 hover:border-brand-gold transition-all duration-300 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed group/btn"
              aria-label={t('menu.quickAdd')}
              aria-live="polite"
              aria-busy={isAdding}
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 rounded-full bg-brand-gold/20 opacity-0 group-hover/btn:opacity-100 blur-md transition-opacity duration-300" />
              
              {/* Icon with animation */}
              <AnimatePresence mode="wait">
                {isAdding ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ duration: 0.3, type: "spring" }}
                  >
                    <Check className="w-5 h-5 md:w-6 md:h-6" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="cart"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ duration: 0.3, type: "spring" }}
                  >
                    <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Ripple effect on click */}
              {isAdding && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-white"
                  initial={{ scale: 1, opacity: 1 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 0.6 }}
                />
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

      <ProductModal 
        product={product} 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
      />
    </>
  );
}