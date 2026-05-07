import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useInView } from 'framer-motion';
import { MenuImage } from '@/data/menuImages';
import { CategoryPill } from '@/components/ui/CategoryPill';
import { categories } from '@/data/categories';
import { Link } from 'wouter';
import { ChevronLeft, ChevronRight, Expand } from 'lucide-react';

export type CardVariant = 'featured-right' | 'featured-left' | 'card-bottom' | 'card-top';

interface MenuImageCardProps {
  item: MenuImage;
  variant: CardVariant;
  index: number;
  onOpenLightbox: () => void;
}

export function MenuImageCard({ item, variant, index, onOpenLightbox }: MenuImageCardProps) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [tapped, setTapped] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  const category = categories.find((c) => c.slug === item.categorySlug);
  const title = isAr ? item.titleAr : item.titleEn;
  const description = isAr ? item.descriptionAr : item.descriptionEn;
  const catLabel = isAr ? category?.labelAr || '' : category?.labelEn || '';

  /* ── Featured horizontal card ─────────────────────────────── */
  if (variant === 'featured-right' || variant === 'featured-left') {
    const descOnRight = variant === 'featured-right';

    const containerVariants = {
      hidden: { opacity: 0, x: descOnRight ? -60 : 60 },
      visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
    };

    const textVariants = {
      hidden: { opacity: 0, x: descOnRight ? 40 : -40 },
      visible: { opacity: 1, x: 0, transition: { duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] } },
    };

    return (
      <motion.div
        ref={ref}
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        className={`relative flex flex-col md:flex-row overflow-hidden rounded-2xl border border-brand-gold/20 shadow-2xl ${descOnRight ? 'md:flex-row' : 'md:flex-row-reverse'}`}
        style={{ background: 'hsl(355, 55%, 7%)' }}
      >
        {/* Image — clickable to open lightbox */}
        <div
          className="relative w-full md:w-[58%] overflow-hidden cursor-zoom-in group/img"
          style={{ minHeight: '320px' }}
          onClick={onOpenLightbox}
          role="button"
          aria-label={`Open ${title} in fullscreen`}
          data-testid={`btn-open-lightbox-${item.id}`}
        >
          <motion.img
            src={item.imageUrl}
            alt={title}
            className="w-full h-full object-cover"
            style={{ minHeight: '320px' }}
            whileHover={{ scale: 1.06 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            loading="lazy"
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: descOnRight
                ? 'linear-gradient(to right, transparent 60%, hsl(355,55%,7%) 100%)'
                : 'linear-gradient(to left, transparent 60%, hsl(355,55%,7%) 100%)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
          {/* Category pill */}
          <div className="absolute top-4 left-4 z-10">
            <CategoryPill label={catLabel} variant="gold" />
          </div>
          {/* Expand hint */}
          <div className="absolute top-4 right-4 z-10 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300">
            <div
              className="p-2 rounded-full"
              style={{ background: 'hsl(355,60%,8%,0.85)', border: '1px solid hsl(43,60%,28%)' }}
            >
              <Expand className="w-4 h-4" style={{ color: 'hsl(43,100%,52%)' }} />
            </div>
          </div>
        </div>

        {/* Description panel */}
        <motion.div
          variants={textVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="relative w-full md:w-[42%] flex flex-col justify-center p-7 md:p-10 z-10"
        >
          <div
            className="absolute top-0 bottom-0 pointer-events-none"
            style={{
              left: descOnRight ? 0 : 'auto',
              right: descOnRight ? 'auto' : 0,
              width: '1px',
              background: 'linear-gradient(to bottom, transparent, hsl(43,100%,52%,0.4), transparent)',
            }}
          />
          <p className="font-body text-xs uppercase tracking-[0.25em] text-brand-gold/60 mb-3">{catLabel}</p>
          <h3
            className="font-heading font-bold mb-4 leading-tight"
            style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', color: 'hsl(43,100%,52%)' }}
          >
            {title}
          </h3>
          <p className="font-body text-sm md:text-base leading-relaxed mb-7" style={{ color: 'hsl(40,25%,70%)' }}>
            {description}
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 self-start font-body font-bold text-sm uppercase tracking-widest px-5 py-2.5 rounded-full border transition-all duration-300 hover:bg-brand-gold/10"
              style={{ color: 'hsl(43,100%,52%)', borderColor: 'hsl(43,100%,52%,0.5)' }}
              data-testid={`link-featured-card-${item.id}`}
            >
              {isAr ? 'اطلب الآن' : 'Order Now'}
              {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Link>
            <button
              onClick={onOpenLightbox}
              className="p-2.5 rounded-full border transition-all duration-300 hover:bg-white/5"
              style={{ borderColor: 'hsl(43,40%,22%)', color: 'hsl(40,20%,55%)' }}
              title={isAr ? 'عرض بالحجم الكامل' : 'View full size'}
              data-testid={`btn-expand-${item.id}`}
            >
              <Expand className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  /* ── Regular grid card (top / bottom overlay) ─────────────── */
  const fromBottom = variant === 'card-bottom';

  const cardReveal = {
    hidden: { opacity: 0, y: fromBottom ? 50 : -50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.65, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const overlayVariants = {
    rest: { opacity: 0, y: fromBottom ? 12 : -12 },
    hover: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
    tapped: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  };

  const descVariants = {
    rest: { opacity: 0, y: fromBottom ? 8 : -8 },
    hover: { opacity: 1, y: 0, transition: { duration: 0.3, delay: 0.07, ease: 'easeOut' } },
    tapped: { opacity: 1, y: 0, transition: { duration: 0.3, delay: 0.07, ease: 'easeOut' } },
  };

  const state = tapped ? 'tapped' : 'rest';

  const handleCardClick = () => {
    // On mobile: single tap shows description, double-tap opens lightbox
    // On desktop: hover shows description, click opens lightbox
    const isTouchDevice = window.matchMedia('(hover: none)').matches;
    if (isTouchDevice && !tapped) {
      setTapped(true);
    } else {
      onOpenLightbox();
    }
  };

  return (
    <motion.div
      ref={ref}
      variants={cardReveal}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className="relative group rounded-xl overflow-hidden select-none"
      style={{ background: 'hsl(355,60%,6%)' }}
      whileHover="hover"
      data-testid={`card-gallery-${item.id}`}
    >
      {/* Image */}
      <div
        className="relative overflow-hidden cursor-zoom-in"
        style={{ aspectRatio: '4/5' }}
        onClick={handleCardClick}
        role="button"
        aria-label={`Open ${title}`}
      >
        <motion.img
          src={item.imageUrl}
          alt={title}
          className="w-full h-full object-cover"
          variants={{ rest: { scale: 1 }, hover: { scale: 1.07 }, tapped: { scale: 1.04 } }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          loading="lazy"
        />

        {/* Gradient overlays */}
        {!fromBottom && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, hsl(355,65%,5%) 0%, rgba(0,0,0,0.6) 40%, transparent 100%)' }}
          />
        )}
        {fromBottom && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(to top, hsl(355,65%,5%) 0%, rgba(0,0,0,0.6) 40%, transparent 100%)' }}
          />
        )}

        {/* Category pill */}
        <div className={`absolute z-20 ${fromBottom ? 'top-3 left-3' : 'bottom-3 left-3'}`}>
          <CategoryPill label={catLabel} variant="red" />
        </div>

        {/* Expand icon — top-right, appears on hover */}
        <motion.div
          className="absolute top-3 right-3 z-20"
          variants={{ rest: { opacity: 0, scale: 0.7 }, hover: { opacity: 1, scale: 1 }, tapped: { opacity: 1, scale: 1 } }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="p-1.5 rounded-full"
            style={{ background: 'hsl(355,60%,8%,0.85)', border: '1px solid hsl(43,55%,22%)' }}
          >
            <Expand className="w-3.5 h-3.5" style={{ color: 'hsl(43,100%,52%)' }} />
          </div>
        </motion.div>

        {/* Gold glow border on hover */}
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          variants={{
            rest: { boxShadow: '0 0 0px transparent' },
            hover: { boxShadow: '0 0 0 2px hsl(43,100%,52%), 0 0 40px hsl(43,100%,52%,0.15)' },
            tapped: { boxShadow: '0 0 0 2px hsl(43,100%,52%), 0 0 40px hsl(43,100%,52%,0.15)' },
          }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Hover/tapped description panel */}
      <motion.div
        className={`absolute ${fromBottom ? 'bottom-0 left-0 right-0' : 'top-0 left-0 right-0'} z-10 p-5 pointer-events-none`}
        variants={overlayVariants}
        animate={state}
      >
        <motion.h3
          className="font-heading font-bold text-lg leading-tight mb-1.5"
          style={{ color: 'hsl(43,100%,52%)' }}
        >
          {title}
        </motion.h3>
        <motion.p
          variants={descVariants}
          animate={state}
          className="font-body text-xs leading-relaxed line-clamp-2"
          style={{ color: 'hsl(40,25%,75%)' }}
        >
          {description}
        </motion.p>
      </motion.div>

      {/* Always-visible title stub */}
      <motion.div
        className={`absolute ${fromBottom ? 'bottom-0 left-0 right-0' : 'top-0 left-0 right-0'} z-10 p-5 pointer-events-none`}
        variants={{ rest: { opacity: 1 }, hover: { opacity: 0 }, tapped: { opacity: 0 } }}
        animate={state}
        transition={{ duration: 0.2 }}
      >
        <p
          className="font-heading font-bold text-base leading-tight line-clamp-1"
          style={{ color: 'hsl(43,100%,52%)' }}
        >
          {title}
        </p>
      </motion.div>
    </motion.div>
  );
}
