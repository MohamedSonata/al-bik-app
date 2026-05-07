import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CategoryFilter } from '@/components/menu/CategoryFilter';
import { ProductGrid } from '@/components/menu/ProductGrid';
import { GoldDivider } from '@/components/ui/GoldDivider';
import { FloatingCartButton } from '@/components/cart/FloatingCartButton';
import { useMenuData } from '@/context/MenuDataContext';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

function ConnectionBadge() {
  const { status, isLive, initialLoading } = useMenuData();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  if (status === 'idle' || initialLoading) return null;

  const configs = {
    connecting: {
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
      label: isAr ? 'جارٍ الاتصال...' : 'Connecting...',
      color: 'hsl(40,80%,52%)',
      border: 'hsl(40,60%,28%)',
    },
    connected: {
      icon: <Wifi className="w-3 h-3" />,
      label: isAr ? 'مباشر' : 'Live',
      color: 'hsl(140,60%,50%)',
      border: 'hsl(140,40%,22%)',
    },
    error: {
      icon: <WifiOff className="w-3 h-3" />,
      label: isAr ? 'بيانات ثابتة' : 'Offline data',
      color: 'hsl(40,20%,50%)',
      border: 'hsl(40,20%,20%)',
    },
    fallback: {
      icon: <WifiOff className="w-3 h-3" />,
      label: isAr ? 'بيانات ثابتة' : 'Offline data',
      color: 'hsl(40,20%,50%)',
      border: 'hsl(40,20%,20%)',
    },
    idle: {
      icon: null,
      label: '',
      color: 'transparent',
      border: 'transparent',
    },
  } as const;

  const cfg = configs[status];

  return (
    <AnimatePresence>
      <motion.div
        key={status}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.3 }}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-body text-xs"
        style={{
          background: 'hsl(355,60%,6%,0.8)',
          border: `1px solid ${cfg.border}`,
          color: cfg.color,
        }}
      >
        {cfg.icon}
        {cfg.label}
        {isLive && (
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse ml-0.5"
            style={{ background: 'hsl(140,60%,50%)' }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export default function MenuPage() {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-brand-charcoal flex flex-col"
    >
      <Navbar />

      <main className="flex-1 pb-20">
        {/* Menu Header */}
        <section className="relative py-16 md:py-24 overflow-hidden bg-brand-surface">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,hsl(35,90%,55%)_1px,transparent_1px)] bg-[size:40px_40px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-charcoal via-transparent to-brand-charcoal" />

          <div className="container relative z-10 mx-auto px-4 text-center">
            <div className="mb-4 flex justify-center">
              <ConnectionBadge />
            </div>
            <h1 className="font-heading text-5xl md:text-7xl font-bold bg-gradient-to-r from-brand-crimson via-brand-gold to-brand-amber bg-clip-text text-transparent mb-4 tracking-wider drop-shadow-xl">
              {t('menu.title')}
            </h1>
            <p className="font-body text-xl md:text-2xl text-brand-gold/80 uppercase tracking-[0.2em]">
              {t('menu.subtitle')}
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0">
            <GoldDivider />
          </div>
        </section>

        {/* No props needed — both components read from context */}
        <CategoryFilter />
        <ProductGrid />
      </main>

      <Footer />
      
      {/* Floating Cart Button */}
      <FloatingCartButton />
    </motion.div>
  );
}
