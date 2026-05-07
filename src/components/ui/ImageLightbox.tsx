import { useEffect, useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { MenuImage } from '@/data/menuImages';
import { useTranslation } from 'react-i18next';
import { categories } from '@/data/categories';

interface ImageLightboxProps {
  images: MenuImage[];
  startIndex: number;
  onClose: () => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const ZOOM_STEP = 0.6;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getPinchDistance(touches: TouchList): number {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

export function ImageLightbox({ images, startIndex, onClose }: ImageLightboxProps) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [index, setIndex] = useState(startIndex);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const lastPinchDist = useRef<number | null>(null);
  const lastPinchMid = useRef<{ x: number; y: number } | null>(null);

  const item = images[index];
  const category = categories.find((c) => c.slug === item.categorySlug);
  const title = isAr ? item.titleAr : item.titleEn;
  const description = isAr ? item.descriptionAr : item.descriptionEn;
  const catLabel = isAr ? category?.labelAr || '' : category?.labelEn || '';

  /* ── Clamp offset so image never drifts out of view ─────── */
  const clampOffset = useCallback((ox: number, oy: number, s: number) => {
    if (!containerRef.current) return { x: ox, y: oy };
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    const maxX = Math.max(0, (cw * (s - 1)) / 2);
    const maxY = Math.max(0, (ch * (s - 1)) / 2);
    return { x: clamp(ox, -maxX, maxX), y: clamp(oy, -maxY, maxY) };
  }, []);

  /* ── Reset zoom when image changes ──────────────────────── */
  useEffect(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setImgLoaded(false);
  }, [index]);

  /* ── Keyboard navigation ─────────────────────────────────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') navigate(1);
      if (e.key === 'ArrowLeft') navigate(-1);
      if (e.key === '+' || e.key === '=') zoomBy(ZOOM_STEP);
      if (e.key === '-') zoomBy(-ZOOM_STEP);
      if (e.key === '0') resetZoom();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  /* ── Prevent body scroll while open ─────────────────────── */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  /* ── Navigation ─────────────────────────────────────────── */
  const navigate = (dir: number) => {
    setIndex((i) => (i + dir + images.length) % images.length);
  };

  /* ── Zoom helpers ────────────────────────────────────────── */
  const zoomBy = (delta: number) => {
    setScale((s) => {
      const next = clamp(s + delta, MIN_SCALE, MAX_SCALE);
      if (next === MIN_SCALE) setOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const resetZoom = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  /* ── Mouse wheel zoom ────────────────────────────────────── */
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.004;
    setScale((s) => {
      const next = clamp(s + delta * s, MIN_SCALE, MAX_SCALE);
      if (next === MIN_SCALE) setOffset({ x: 0, y: 0 });
      return next;
    });
  };

  /* ── Mouse drag (pan when zoomed) ───────────────────────── */
  const onMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setOffset(clampOffset(dragStart.current.ox + dx, dragStart.current.oy + dy, scale));
  };

  const onMouseUp = () => setIsDragging(false);

  /* ── Touch handlers (pan + pinch zoom) ──────────────────── */
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      lastPinchDist.current = getPinchDistance(e.touches);
      lastPinchMid.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
    } else if (e.touches.length === 1 && scale > 1) {
      dragStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        ox: offset.x,
        oy: offset.y,
      };
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastPinchDist.current !== null) {
      e.preventDefault();
      const dist = getPinchDistance(e.touches);
      const ratio = dist / lastPinchDist.current;
      setScale((s) => {
        const next = clamp(s * ratio, MIN_SCALE, MAX_SCALE);
        if (next === MIN_SCALE) setOffset({ x: 0, y: 0 });
        return next;
      });
      lastPinchDist.current = dist;
    } else if (e.touches.length === 1 && scale > 1) {
      const dx = e.touches[0].clientX - dragStart.current.x;
      const dy = e.touches[0].clientY - dragStart.current.y;
      setOffset(clampOffset(dragStart.current.ox + dx, dragStart.current.oy + dy, scale));
    }
  };

  const onTouchEnd = () => {
    lastPinchDist.current = null;
    lastPinchMid.current = null;
  };

  /* ── Double-tap to toggle zoom ────────────────────────────── */
  const lastTap = useRef(0);
  const onImgClick = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      scale > 1 ? resetZoom() : zoomBy(1.5);
    }
    lastTap.current = now;
  };

  const scalePercent = Math.round(scale * 100);

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="lightbox-backdrop"
        className="fixed inset-0 z-[200] flex flex-col"
        style={{ background: 'rgba(5,2,2,0.97)', backdropFilter: 'blur(12px)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        {/* ── Top bar ────────────────────────────────────────── */}
        <motion.div
          className="flex items-center justify-between px-4 md:px-6 py-3 shrink-0"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          style={{ borderBottom: '1px solid hsl(43,60%,20%)' }}
        >
          {/* Category + counter */}
          <div className="flex items-center gap-3">
            <span
              className="font-body text-xs uppercase tracking-widest px-3 py-1 rounded-full"
              style={{ background: 'hsl(0,85%,44%)', color: '#fff' }}
            >
              {catLabel}
            </span>
            <span className="font-body text-xs" style={{ color: 'hsl(40,20%,50%)' }}>
              {index + 1} / {images.length}
            </span>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 md:gap-2">
            <button
              onClick={resetZoom}
              disabled={scale === 1}
              className="p-2 rounded-lg transition-colors disabled:opacity-30"
              style={{ color: 'hsl(43,100%,52%)' }}
              title="Reset zoom (0)"
              data-testid="btn-zoom-reset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => zoomBy(-ZOOM_STEP)}
              disabled={scale <= MIN_SCALE}
              className="p-2 rounded-lg transition-colors disabled:opacity-30"
              style={{ color: 'hsl(43,100%,52%)' }}
              title="Zoom out (-)"
              data-testid="btn-zoom-out"
            >
              <ZoomOut className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <span
              className="font-price text-sm min-w-[3rem] text-center tabular-nums"
              style={{ color: 'hsl(43,100%,52%)' }}
            >
              {scalePercent}%
            </span>
            <button
              onClick={() => zoomBy(ZOOM_STEP)}
              disabled={scale >= MAX_SCALE}
              className="p-2 rounded-lg transition-colors disabled:opacity-30"
              style={{ color: 'hsl(43,100%,52%)' }}
              title="Zoom in (+)"
              data-testid="btn-zoom-in"
            >
              <ZoomIn className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <div className="w-px h-5 mx-1" style={{ background: 'hsl(43,30%,20%)' }} />
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors hover:bg-white/10"
              style={{ color: 'hsl(40,20%,70%)' }}
              title="Close (Esc)"
              data-testid="btn-lightbox-close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* ── Image area ────────────────────────────────────── */}
        <div
          ref={containerRef}
          className="flex-1 relative flex items-center justify-center overflow-hidden"
          style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in' }}
          onWheel={onWheel}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Prev button */}
          {images.length > 1 && (
            <motion.button
              onClick={() => navigate(-1)}
              className="absolute left-2 md:left-4 z-20 p-3 rounded-full transition-all hover:scale-110 active:scale-95"
              style={{ background: 'hsl(355,60%,8%)', border: '1px solid hsl(43,60%,22%)', color: 'hsl(43,100%,52%)' }}
              whileTap={{ scale: 0.9 }}
              data-testid="btn-lightbox-prev"
            >
              {isAr ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </motion.button>
          )}

          {/* Image */}
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full flex items-center justify-center select-none"
          >
            <img
              ref={imgRef}
              src={item.imageUrl.replace('w=600', 'w=1400').replace('w=700', 'w=1400').replace('w=900', 'w=1400')}
              alt={title}
              onClick={onImgClick}
              onLoad={() => setImgLoaded(true)}
              draggable={false}
              className="max-w-full max-h-full object-contain transition-none pointer-events-auto select-none"
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                transformOrigin: 'center center',
                transition: isDragging || lastPinchDist.current !== null ? 'none' : 'transform 0.18s ease-out',
                maxHeight: 'calc(100vh - 160px)',
                opacity: imgLoaded ? 1 : 0,
              }}
              data-testid="img-lightbox"
            />
          </motion.div>

          {/* Loading shimmer */}
          {!imgLoaded && (
            <div
              className="absolute inset-0 flex items-center justify-center"
            >
              <div
                className="w-16 h-16 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: 'hsl(43,100%,52%)', borderTopColor: 'transparent' }}
              />
            </div>
          )}

          {/* Next button */}
          {images.length > 1 && (
            <motion.button
              onClick={() => navigate(1)}
              className="absolute right-2 md:right-4 z-20 p-3 rounded-full transition-all hover:scale-110 active:scale-95"
              style={{ background: 'hsl(355,60%,8%)', border: '1px solid hsl(43,60%,22%)', color: 'hsl(43,100%,52%)' }}
              whileTap={{ scale: 0.9 }}
              data-testid="btn-lightbox-next"
            >
              {isAr ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </motion.button>
          )}

          {/* Hint overlay (first open, zoom = 1) */}
          {scale === 1 && imgLoaded && (
            <motion.div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full pointer-events-none"
              style={{ background: 'hsl(355,60%,8%,0.8)', border: '1px solid hsl(43,40%,18%)' }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              <Maximize2 className="w-3 h-3" style={{ color: 'hsl(43,100%,52%)' }} />
              <span className="font-body text-xs" style={{ color: 'hsl(40,20%,60%)' }}>
                {isAr ? 'انقر مرتين أو استخدم العجلة للتكبير' : 'Double-tap or scroll to zoom'}
              </span>
            </motion.div>
          )}
        </div>

        {/* ── Bottom info bar ───────────────────────────────── */}
        <motion.div
          className="shrink-0 px-4 md:px-8 py-4 md:py-5"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          style={{ borderTop: '1px solid hsl(43,60%,15%)' }}
        >
          <h3
            className="font-heading font-bold text-lg md:text-2xl mb-1 leading-tight"
            style={{ color: 'hsl(43,100%,52%)' }}
          >
            {title}
          </h3>
          <p className="font-body text-sm leading-relaxed line-clamp-2 md:line-clamp-none" style={{ color: 'hsl(40,20%,60%)' }}>
            {description}
          </p>
        </motion.div>

        {/* ── Thumbnail strip ──────────────────────────────── */}
        {images.length > 1 && (
          <motion.div
            className="shrink-0 flex gap-2 overflow-x-auto px-4 pb-4 scrollbar-hide justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setIndex(i)}
                className="shrink-0 rounded-lg overflow-hidden transition-all duration-300"
                style={{
                  width: '52px',
                  height: '52px',
                  border: i === index ? '2px solid hsl(43,100%,52%)' : '2px solid transparent',
                  opacity: i === index ? 1 : 0.45,
                  transform: i === index ? 'scale(1.08)' : 'scale(1)',
                }}
                data-testid={`btn-thumbnail-${i}`}
              >
                <img
                  src={img.imageUrl}
                  alt={isAr ? img.titleAr : img.titleEn}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
