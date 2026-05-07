import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export function OfferMarquee() {
  const { t } = useTranslation();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    setPrefersReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  const offers = [
    t('marquee.offer1'),
    t('marquee.offer2'),
    t('marquee.offer3'),
    t('marquee.offer4'),
  ];

  return (
    <div className="w-full bg-brand-crimson text-brand-foreground py-3 overflow-hidden border-y border-brand-gold/30">
      <div 
        className={cn(
          "flex whitespace-nowrap items-center hover:[animation-play-state:paused]",
          !prefersReducedMotion && "animate-[marquee_20s_linear_infinite]"
        )}
      >
        {/* Duplicate the array twice for seamless loop */}
        {[...offers, ...offers, ...offers, ...offers].map((offer, i) => (
          <div key={i} className="flex items-center mx-8">
            <span className="font-heading text-sm md:text-base tracking-widest uppercase font-bold text-white drop-shadow-md">{offer}</span>
            <span className="mx-8 text-brand-gold text-lg">★</span>
          </div>
        ))}
      </div>
    </div>
  );
}