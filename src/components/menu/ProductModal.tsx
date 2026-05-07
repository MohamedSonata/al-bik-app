import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Plus, Minus, ShoppingCart } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Product } from '@/data/products';
import { PriceBadge } from '@/components/ui/PriceBadge';
import { useCartStore } from '@/stores/cart.store';
import { useToast } from '@/hooks/use-toast';

interface ProductModalProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductModal({ product, open, onOpenChange }: ProductModalProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [imgError, setImgError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const addItem = useCartStore((state) => state.addItem);
  const { toast } = useToast();

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

  const handleIncrement = () => {
    if (quantity < 99) {
      setQuantity(quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleAddToCart = () => {
    try {
      // Convert Product to MenuProduct format expected by cart store
      const menuProduct = {
        id: product.id,
        name: isAr ? product.nameAr : product.nameEn,
        price: displayPrice,
        discountedPrice: product.discountedPrice,
      };

      addItem(menuProduct as any, quantity, [], notes || undefined);
      
      toast({
        title: t('cart.itemAdded'),
        description: `${quantity}x ${productName}`,
      });

      // Reset form and close modal
      setQuantity(1);
      setNotes('');
      onOpenChange(false);
    } catch (error) {
      toast({
        title: t('cart.error'),
        description: error instanceof Error ? error.message : t('cart.addError'),
        variant: 'destructive',
      });
    }
  };

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

                  {/* Quantity Controls */}
                  <div className="mb-6">
                    <h4 className="font-body font-bold text-brand-gold mb-3 uppercase tracking-widest text-sm">
                      {t('cart.quantity')}
                    </h4>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={handleDecrement}
                        disabled={quantity <= 1}
                        className="w-10 h-10 rounded-lg bg-brand-charcoal border border-brand-gold/20 flex items-center justify-center hover:bg-brand-gold/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <span className="text-2xl font-bold min-w-[3ch] text-center">{quantity}</span>
                      <button
                        onClick={handleIncrement}
                        disabled={quantity >= 99}
                        className="w-10 h-10 rounded-lg bg-brand-charcoal border border-brand-gold/20 flex items-center justify-center hover:bg-brand-gold/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="mb-6">
                    <h4 className="font-body font-bold text-brand-gold mb-3 uppercase tracking-widest text-sm">
                      {t('cart.notes')} ({t('cart.optional')})
                    </h4>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={t('cart.notesPlaceholder')}
                      className="w-full px-4 py-3 bg-brand-charcoal border border-brand-gold/20 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-gold/50 resize-none"
                      rows={3}
                    />
                  </div>
                </motion.div>

                <div className="mt-auto pt-6 border-t border-brand-gold/10 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      {hasDiscount && (
                        <span className="text-sm text-muted-foreground line-through">
                          {product.price} {isAr ? 'دأ' : 'SAR'}
                        </span>
                      )}
                      <PriceBadge price={displayPrice * quantity} className="text-2xl px-5 py-2.5" />
                    </div>
                  </div>
                  
                  {/* Add to Cart Button */}
                  <button
                    onClick={handleAddToCart}
                    className="w-full flex items-center justify-center gap-2 bg-brand-gold hover:bg-brand-gold/90 text-brand-charcoal py-3 px-6 rounded-lg font-body font-bold uppercase tracking-wider transition-all"
                    data-testid="btn-add-to-cart"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {t('cart.addToCart')}
                  </button>

                  {/* WhatsApp Button */}
                  <a 
                    href={orderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-brand-crimson hover:bg-brand-crimson/90 text-white py-3 px-6 rounded-lg font-body font-bold uppercase tracking-wider transition-all hover:animate-[glowPulse_2s_infinite]"
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