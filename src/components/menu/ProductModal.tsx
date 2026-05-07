import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Product } from '@/data/products';
import { PriceBadge } from '@/components/ui/PriceBadge';

interface ProductModalProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductModal({ product, open, onOpenChange }: ProductModalProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [imgError, setImgError] = useState(false);

  const defaultImage = '/images/cat-general.png';
  const imageUrl = imgError || !product.imageUrl ? defaultImage : product.imageUrl;
  
  const hasDiscount = product.discountPercentage && product.discountPercentage > 0;
  const displayPrice = hasDiscount && product.discountedPrice ? product.discountedPrice : product.price;
  
  const whatsappNumber = '0793540333';
  const productName = isAr ? product.nameAr : product.nameEn;
  const message = isAr 
    ? `مرحباً، أود طلب: ${productName}\nالسعر: ${displayPrice} دأ`
    : `Hello, I would like to order: ${productName}\nPrice: ${displayPrice} SAR`;
  
  const orderUrl = `https://wa.me/962${whatsappNumber.slice(1)}?text=${encodeURIComponent(message)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogContent 
            className="p-0 bg-brand-surface border-brand-gold/30 text-foreground overflow-hidden max-w-2xl gap-0 sm:rounded-3xl"
            data-testid={`modal-product-${product.id}`}
          >
            <DialogTitle className="sr-only">
              {isAr ? product.nameAr : product.nameEn}
            </DialogTitle>
            
            <DialogClose className="absolute right-4 top-4 z-50 rounded-full p-2 bg-black/50 text-white hover:bg-brand-crimson transition-colors backdrop-blur-sm border border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-gold">
              <X className="w-5 h-5" />
              <span className="sr-only">Close</span>
            </DialogClose>

            <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
              {/* Image Column */}
              <div className="w-full md:w-1/2 relative min-h-[250px] md:min-h-full">
                <img 
                  src={imageUrl} 
                  alt={isAr ? product.nameAr : product.nameEn}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-surface md:bg-gradient-to-r md:from-transparent md:to-brand-surface" />
                {hasDiscount && (
                  <div className="absolute top-4 right-4 bg-brand-crimson text-white px-4 py-2 rounded-lg text-lg font-bold shadow-xl z-10">
                    -{product.discountPercentage}% {isAr ? 'خصم' : 'OFF'}
                  </div>
                )}
              </div>

              {/* Content Column */}
              <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col relative z-10 overflow-y-auto">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h2 className="font-heading text-3xl font-bold text-brand-gold mb-2">
                    {isAr ? product.nameAr : product.nameEn}
                  </h2>
                  <h3 className="font-heading text-lg text-muted-foreground mb-6 pb-6 border-b border-brand-gold/10">
                    {!isAr ? product.nameAr : product.nameEn}
                  </h3>

                  <p className="font-body text-foreground/90 text-lg leading-relaxed mb-8">
                    {isAr ? product.descriptionAr : product.descriptionEn}
                  </p>

                  <div className="mb-8">
                    <h4 className="font-body font-bold text-brand-gold mb-3 uppercase tracking-widest text-sm">
                      {t('menu.ingredients')}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {product.ingredients.map((ingredient, idx) => (
                        <span 
                          key={idx}
                          className="px-3 py-1 bg-brand-charcoal rounded-full text-sm font-body border border-brand-gold/20 text-foreground/80"
                        >
                          {ingredient}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>

                <div className="mt-auto pt-6 border-t border-brand-gold/10 flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    {hasDiscount && (
                      <span className="text-sm text-muted-foreground line-through">
                        {product.price} {isAr ? 'دأ' : 'SAR'}
                      </span>
                    )}
                    <PriceBadge price={displayPrice} className="text-2xl px-5 py-2.5" />
                  </div>
                  <a 
                    href={orderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-brand-crimson hover:bg-brand-crimson/90 text-white py-3 px-6 rounded-lg font-body font-bold uppercase tracking-wider transition-all hover:animate-[glowPulse_2s_infinite]"
                    data-testid="btn-order-whatsapp"
                  >
                    <MessageCircle className="w-5 h-5" />
                    {t('menu.orderOnWhatsApp')}
                  </a>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
}