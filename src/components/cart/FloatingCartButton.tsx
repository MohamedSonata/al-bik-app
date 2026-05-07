import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/stores/cart.store';
import { Button } from '@/components/ui/button';

export function FloatingCartButton() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [, setLocation] = useLocation();
  const { cart } = useCartStore();

  if (cart.isEmpty) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className={`fixed bottom-6 ${isAr ? 'left-6' : 'right-6'} z-40`}
      >
        <div className="relative">
          {/* Pulse ring animation */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute inset-0 rounded-full bg-brand-crimson"
          />
          
          <Button
            onClick={() => setLocation('/cart')}
            size="lg"
            className="relative h-14 w-14 rounded-full shadow-2xl bg-brand-crimson hover:bg-brand-crimson/90 border-2 border-brand-gold/50 hover:border-brand-gold transition-all duration-300 hover:scale-110"
          >
            <ShoppingCart className="w-6 h-6" />
            
            {/* Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 bg-brand-gold text-brand-charcoal rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg"
            >
              {cart.itemCount}
            </motion.div>
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
