import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { CategoryPill } from '@/components/ui/CategoryPill';
import { PriceBadge } from '@/components/ui/PriceBadge';
import { Product } from '@/data/products';
import { categories } from '@/data/categories';
import { ProductModal } from './ProductModal';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [modalOpen, setModalOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  const category = categories.find(c => c.slug === product.category);
  const defaultImage = '/images/cat-general.png';
  const imageUrl = imgError || !product.imageUrl ? defaultImage : product.imageUrl;
  
  const hasDiscount = product.discountPercentage && product.discountPercentage > 0;
  const displayPrice = hasDiscount && product.discountedPrice ? product.discountedPrice : product.price;

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
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-brand-charcoal border border-brand-gold/20 flex items-center justify-center text-brand-gold group-hover:bg-brand-crimson group-hover:text-white group-hover:border-brand-crimson transition-colors duration-300 flex-shrink-0">
              {isAr ? <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" /> : <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />}
            </div>
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