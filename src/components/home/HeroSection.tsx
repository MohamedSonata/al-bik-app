import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'wouter';
import { MapPin, Star, Flame } from 'lucide-react';

/* ── Floating ember particles ─────────────────────────────── */
function EmberParticles() {
  const [embers, setEmbers] = useState<{ id: number; left: number; delay: number; duration: number; size: number }[]>([]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setEmbers(
      Array.from({ length: 12 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 6,
        duration: 4 + Math.random() * 5,
        size: 2 + Math.random() * 3,
      }))
    );
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {embers.map((e) => (
        <div
          key={e.id}
          className="absolute bottom-0 rounded-full"
          style={{
            left: `${e.left}%`,
            width: `${e.size}px`,
            height: `${e.size}px`,
            background: `radial-gradient(circle, hsl(43,100%,70%) 0%, hsl(0,85%,55%) 60%, transparent 100%)`,
            animation: `emberFloat ${e.duration}s infinite linear ${e.delay}s`,
            filter: 'blur(0.5px)',
          }}
        />
      ))}
    </div>
  );
}

/* ── Animated scroll indicator ────────────────────────────── */
function ScrollIndicator({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      aria-label="Scroll down"
      className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 group"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.4, duration: 0.6 }}
    >
      <span
        className="font-body text-[10px] uppercase tracking-[0.25em] transition-colors"
        style={{ color: 'hsl(43,80%,52%,0.5)' }}
      >
        scroll
      </span>
      <div className="relative w-px h-12 overflow-hidden" style={{ background: 'hsl(43,60%,30%)' }}>
        <motion.div
          className="absolute top-0 left-0 w-full"
          style={{ background: 'hsl(43,100%,52%)', height: '40%' }}
          animate={{ y: ['0%', '160%', '0%'] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
        />
      </div>
    </motion.button>
  );
}

/* ── Floating stat chip ────────────────────────────────────── */
function StatChip({ icon, label, delay }: { icon: React.ReactNode; label: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-body text-xs"
      style={{
        background: 'hsl(355,60%,6%,0.75)',
        border: '1px solid hsl(43,60%,22%)',
        backdropFilter: 'blur(10px)',
        color: 'hsl(40,25%,75%)',
      }}
    >
      <span style={{ color: 'hsl(43,100%,52%)' }}>{icon}</span>
      {label}
    </motion.div>
  );
}

/* ── Main Hero ────────────────────────────────────────────── */
export function HeroSection() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const heroRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '12%']);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  const scrollToGallery = () => {
    document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' });
  };

  /* Title words stagger */
  const words = (isAr ? ['البيك'] : ['AL-', 'BAIK']);

  return (
    <section
      ref={heroRef}
      className="relative w-full overflow-hidden"
      style={{ height: '100svh', minHeight: '600px' }}
    >
      {/* ── Parallax background ──────────────────────────── */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/hero-bg.png')", y: bgY, scale: 1.08 }}
      />

      {/* ── Multi-layer vignette ─────────────────────────── */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, hsl(355,65%,4%) 0%, hsl(355,65%,5%,0.6) 35%, hsl(355,65%,5%,0.2) 65%, transparent 100%)' }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(105deg, hsl(355,65%,4%,0.85) 0%, transparent 50%)' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 70% 40%, hsl(0,85%,44%,0.04) 0%, transparent 60%)' }} />

      {/* ── Decorative vertical accent line (left) ───────── */}
      <motion.div
        className="absolute top-0 left-6 md:left-10 hidden md:flex flex-col items-center gap-3 z-20"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        transition={{ delay: 0.8, duration: 1 }}
      >
        <div style={{ width: '1px', height: '80px', background: 'linear-gradient(to bottom, transparent, hsl(43,100%,52%,0.5))' }} />
        <span
          className="font-body text-[10px] uppercase tracking-[0.35em] whitespace-nowrap"
          style={{ color: 'hsl(43,80%,52%,0.45)', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          Est · 2026
        </span>
        <div style={{ width: '1px', flex: 1, maxHeight: '160px', background: 'linear-gradient(to bottom, hsl(43,100%,52%,0.25), transparent)' }} />
      </motion.div>

      {/* ── Decorative top-right corner ornament ─────────── */}
      <motion.div
        className="absolute top-0 right-0 pointer-events-none hidden md:block"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 1.2 }}
      >
        <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
          <path d="M200 0 L200 200" stroke="hsl(43,100%,52%)" strokeWidth="0.5" strokeOpacity="0.2" />
          <path d="M200 0 L100 0" stroke="hsl(43,100%,52%)" strokeWidth="0.5" strokeOpacity="0.2" />
          <path d="M200 0 L130 70" stroke="hsl(43,100%,52%)" strokeWidth="0.5" strokeOpacity="0.12" />
          <circle cx="200" cy="0" r="80" stroke="hsl(43,100%,52%)" strokeWidth="0.5" strokeOpacity="0.07" fill="none" />
          <circle cx="200" cy="0" r="40" stroke="hsl(0,85%,44%)" strokeWidth="0.5" strokeOpacity="0.1" fill="none" />
        </svg>
      </motion.div>

      <EmberParticles />

      {/* ── Main content ─────────────────────────────────── */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center z-10 px-4"
        style={{ y: contentY, opacity: overlayOpacity }}
      >
        {/* Grand opening badge */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 md:mb-8"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-body text-xs uppercase tracking-[0.25em]"
            style={{
              background: 'hsl(355,60%,6%,0.8)',
              border: '1px solid hsl(0,85%,44%,0.4)',
              backdropFilter: 'blur(12px)',
              color: 'hsl(0,85%,70%)',
            }}
          >
            <Flame className="w-3 h-3" style={{ color: 'hsl(43,100%,52%)' }} />
            {isAr ? 'الافتتاح الكبير · 2026' : 'Grand Opening · 2026'}
            <Flame className="w-3 h-3" style={{ color: 'hsl(43,100%,52%)' }} />
          </div>
        </motion.div>

        {/* ── Brand name — large staggered reveal ──────── */}
        <div className="flex flex-col items-center leading-none mb-4 md:mb-6 select-none">
          {words.map((word, wi) => (
            <motion.span
              key={wi}
              initial={{ opacity: 0, y: 40, rotateX: 20 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ delay: 0.35 + wi * 0.18, duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
              className="font-heading font-bold block"
              style={{
                fontSize: 'clamp(5rem, 18vw, 13rem)',
                lineHeight: 0.88,
                background: `linear-gradient(135deg, hsl(0,85%,55%) 0%, hsl(43,100%,52%) 45%, hsl(28,100%,58%) 75%, hsl(43,100%,72%) 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 4px 32px hsl(0,85%,44%,0.35))',
                letterSpacing: isAr ? '-0.02em' : '0.04em',
              }}
            >
              {word}
            </motion.span>
          ))}
        </div>

        {/* ── Subtitle ─────────────────────────────────── */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="font-body text-center mb-7 md:mb-8"
          style={{
            fontSize: 'clamp(0.95rem, 2.5vw, 1.35rem)',
            color: 'hsl(40,30%,72%)',
            letterSpacing: '0.08em',
            maxWidth: '460px',
          }}
        >
          {isAr ? t('hero.subtitleAr') : t('hero.subtitle')}
        </motion.p>

        {/* ── Floating stat chips ───────────────────────── */}
        <motion.div
          className="flex flex-wrap justify-center gap-2 mb-9 md:mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <StatChip icon={<Star className="w-3 h-3" fill="currentColor" />} label="4.8  Rating" delay={0.92} />
          <StatChip icon={<Flame className="w-3 h-3" />} label={isAr ? 'مشوي على الفحم' : 'Charcoal Grilled'} delay={1.02} />
          <StatChip icon={<MapPin className="w-3 h-3" />} label={isAr ? 'المزار الجنوبي' : 'Al-Mazar, Jordan'} delay={1.12} />
        </motion.div>

        {/* ── CTA buttons ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.05, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center"
        >
          {/* Primary — crimson glow */}
          <button
            onClick={scrollToGallery}
            data-testid="btn-order-now"
            className="relative group overflow-hidden font-body font-bold uppercase tracking-widest text-sm px-8 py-4 rounded-full transition-all duration-300"
            style={{ background: 'hsl(0,85%,44%)', color: '#fff', minWidth: '170px' }}
          >
            <span className="relative z-10">{t('hero.orderNow')}</span>
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: 'radial-gradient(circle at center, hsl(0,85%,54%) 0%, hsl(0,85%,40%) 100%)' }}
            />
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full"
              style={{ boxShadow: '0 0 30px hsl(0,85%,44%,0.6)' }}
            />
          </button>

          {/* Secondary — ghost gold */}
          <Link
            href="/menu"
            data-testid="btn-view-menu"
            className="font-body font-bold uppercase tracking-widest text-sm px-8 py-4 rounded-full border transition-all duration-300 hover:bg-brand-gold/8"
            style={{ color: 'hsl(43,100%,52%)', borderColor: 'hsl(43,60%,28%)', minWidth: '170px', textAlign: 'center' }}
          >
            {t('hero.viewMenu')}
          </Link>
        </motion.div>
      </motion.div>

      {/* ── Bottom frosted info strip ─────────────────────── */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 z-20 hidden md:flex items-center justify-between px-10 py-4"
        style={{ background: 'linear-gradient(to top, hsl(355,65%,4%) 0%, transparent 100%)', borderTop: '1px solid hsl(43,40%,12%)' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.7 }}
      >
        <p className="font-body text-xs uppercase tracking-[0.25em]" style={{ color: 'hsl(40,20%,40%)' }}>
          {isAr ? 'المزار الجنوبي — شارع التربيه' : 'Al-Mazar Al-Janoobi — Tarbiya St.'}
        </p>
        <div className="w-px h-4" style={{ background: 'hsl(43,40%,18%)' }} />
        <p className="font-body text-xs uppercase tracking-[0.25em]" style={{ color: 'hsl(40,20%,40%)' }}>
          {isAr ? '٠٧٩٣٥٤٠٣٣٣' : '0793 540 333'}
        </p>
        <div className="w-px h-4" style={{ background: 'hsl(43,40%,18%)' }} />
        <p className="font-body text-xs uppercase tracking-[0.25em]" style={{ color: 'hsl(40,20%,40%)' }}>
          {isAr ? 'يفتح يومياً من ١٠ صباحاً' : 'Open Daily from 10:00 AM'}
        </p>
      </motion.div>

      <ScrollIndicator onClick={scrollToGallery} />
    </section>
  );
}
