import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { MenuImageCard, CardVariant } from './MenuImageCard';
import { menuImages } from '@/data/menuImages';
import { GoldDivider } from '@/components/ui/GoldDivider';
import { ImageLightbox } from '@/components/ui/ImageLightbox';
import { Link } from 'wouter';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/* Layout assignment for each item position */
const VARIANTS: CardVariant[] = [
  'featured-right',
  'card-bottom',
  'card-top',
  'card-bottom',
  'featured-left',
  'card-top',
  'card-bottom',
  'card-top',
  'card-bottom',
];

const INITIAL_COUNT = 5;

export function MenuGallery() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [expanded, setExpanded] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const titleInView = useInView(titleRef, { once: true, margin: '-60px' });

  const displayed = expanded ? menuImages : menuImages.slice(0, INITIAL_COUNT);

  /* Build groups: featured cards vs grid rows */
  const groups: Array<
    | { type: 'featured'; item: (typeof menuImages)[0]; variant: CardVariant; idx: number }
    | { type: 'grid'; items: Array<{ item: (typeof menuImages)[0]; variant: CardVariant; idx: number }> }
  > = [];

  let gridBuffer: Array<{ item: (typeof menuImages)[0]; variant: CardVariant; idx: number }> = [];

  displayed.forEach((item, i) => {
    const variant = VARIANTS[i] ?? 'card-bottom';
    if (variant === 'featured-right' || variant === 'featured-left') {
      if (gridBuffer.length > 0) {
        groups.push({ type: 'grid', items: [...gridBuffer] });
        gridBuffer = [];
      }
      groups.push({ type: 'featured', item, variant, idx: i });
    } else {
      gridBuffer.push({ item, variant, idx: i });
    }
  });
  if (gridBuffer.length > 0) groups.push({ type: 'grid', items: [...gridBuffer] });

  return (
    <section id="gallery" className="py-20 overflow-hidden" style={{ background: 'hsl(355,65%,4%)' }}>
      <div className="container mx-auto px-4">

        {/* Section header */}
        <motion.div
          ref={titleRef}
          initial={{ opacity: 0, y: 30 }}
          animate={titleInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-14"
        >
          <p
            className="font-body text-xs uppercase tracking-[0.3em] mb-3"
            style={{ color: 'hsl(43,100%,52%,0.6)' }}
          >
            {isAr ? 'اكتشف نكهاتنا' : 'Explore Our Flavours'}
          </p>
          <h2
            className="font-heading font-bold mb-6"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: 'hsl(43,100%,52%)' }}
          >
            {t('gallery.title')}
          </h2>
          <GoldDivider />
        </motion.div>

        {/* Cards */}
        <div className="space-y-5 md:space-y-6">
          {groups.map((group, gi) => {
            if (group.type === 'featured') {
              return (
                <div key={`featured-${gi}`}>
                  <MenuImageCard
                    item={group.item}
                    variant={group.variant}
                    index={group.idx}
                    onOpenLightbox={() => setLightboxIndex(group.idx)}
                  />
                </div>
              );
            }

            const cols = group.items.length === 1 ? 1 : group.items.length === 2 ? 2 : 3;
            return (
              <div
                key={`grid-${gi}`}
                className={`grid gap-4 md:gap-5 ${
                  cols === 1
                    ? 'grid-cols-1'
                    : cols === 2
                    ? 'grid-cols-2'
                    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                }`}
              >
                {group.items.map(({ item, variant, idx }) => (
                  <MenuImageCard
                    key={item.id}
                    item={item}
                    variant={variant}
                    index={idx}
                    onOpenLightbox={() => setLightboxIndex(idx)}
                  />
                ))}
              </div>
            );
          })}
        </div>

        {/* CTA row */}
        <motion.div
          className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {!expanded && menuImages.length > INITIAL_COUNT && (
            <button
              onClick={() => setExpanded(true)}
              className="font-body font-bold text-sm uppercase tracking-widest px-8 py-3.5 rounded-full border transition-all duration-300 hover:bg-brand-gold/10 active:scale-95"
              style={{ color: 'hsl(43,100%,52%)', borderColor: 'hsl(43,60%,28%)' }}
              data-testid="btn-load-more"
            >
              {t('gallery.loadMore')}
            </button>
          )}
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 font-body font-bold text-sm uppercase tracking-widest px-8 py-3.5 rounded-full transition-all duration-300 active:scale-95"
            style={{ background: 'hsl(0,85%,44%)', color: '#fff' }}
            data-testid="link-view-full-menu"
          >
            {isAr ? 'عرض القائمة الكاملة' : 'View Full Menu'}
            {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Link>
        </motion.div>
      </div>

      {/* Lightbox portal */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <ImageLightbox
            images={menuImages}
            startIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
