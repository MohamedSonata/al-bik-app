import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/stores/cart.store';

export function FloatingCartButton() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [, setLocation] = useLocation();
  const { cart } = useCartStore();

  if (cart.isEmpty) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0, y: 100 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0, opacity: 0, y: 100 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className={`fixed bottom-6 ${isAr ? 'left-6' : 'right-6'} z-40`}
      >
        <motion.button
          onClick={() => setLocation('/cart')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="group relative"
          aria-label={`${t('cart.title')} - ${cart.itemCount} ${t('cart.items')}`}
          aria-live="polite"
        >
          {/* Animated pulse rings */}
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.6, 0, 0.6],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute inset-0 rounded-full bg-brand-crimson blur-md"
          />
          
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.4, 0, 0.4],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.5,
            }}
            className="absolute inset-0 rounded-full bg-brand-gold blur-sm"
          />

          {/* Main button container */}
          <div className="relative flex items-center gap-3 h-16 pl-5 pr-6 rounded-full bg-gradient-to-r from-brand-crimson via-brand-crimson to-brand-crimson/90 shadow-2xl border-2 border-brand-gold/50 group-hover:border-brand-gold transition-all duration-300">
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-brand-gold/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Cart icon with badge */}
            <div className="relative z-10">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
              >
                <ShoppingCart className="w-7 h-7 text-white" />
              </motion.div>
              
              {/* Badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 bg-brand-gold text-brand-charcoal rounded-full min-w-[24px] h-6 px-1.5 flex items-center justify-center text-xs font-bold shadow-lg ring-2 ring-brand-crimson"
              >
                {cart.itemCount}
              </motion.div>
            </div>

            {/* Price and arrow */}
            <div className="relative z-10 flex items-center gap-2">
              <div className="flex flex-col items-start">
                <span className="text-white/80 text-[10px] font-medium uppercase tracking-wide">
                  {t('cart.total')}
                </span>
                <span className="text-white text-lg font-bold leading-none">
                  {cart.total.toFixed(2)} {t('menu.sar')}
                </span>
              </div>
              
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
              >
                <ArrowRight className="w-5 h-5 text-white" />
              </motion.div>
            </div>
          </div>

          {/* Shine effect */}
          <motion.div
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
              ease: 'easeInOut',
            }}
            className="absolute inset-0 overflow-hidden rounded-full"
          >
            <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
          </motion.div>
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
}
