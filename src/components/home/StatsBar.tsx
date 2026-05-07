import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useInView } from 'framer-motion';
import { Flame, Users, Star, Leaf } from 'lucide-react';

function Counter({ from, to, duration = 1.8 }: { from: number; to: number; duration?: number }) {
  const [count, setCount] = useState(from);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (!isInView) return;
    let startTime: number | null = null;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(from + (to - from) * easeProgress));
      if (progress < 1) requestAnimationFrame(animate);
      else setCount(to);
    };
    requestAnimationFrame(animate);
  }, [from, to, duration, isInView]);

  return <span ref={ref}>{count}</span>;
}

export function StatsBar() {
  const { t } = useTranslation();

  const stats = [
    {
      icon: <Flame className="w-6 h-6" />,
      value: null,
      display: '2026',
      suffix: '',
      label: 'Est. in Jordan',
      labelAr: 'تأسس في الأردن',
    },
    {
      icon: <Users className="w-6 h-6" />,
      value: 10,
      suffix: 'K+',
      label: t('stats.customers'),
      labelAr: null,
    },
    {
      icon: <Star className="w-6 h-6" />,
      value: null,
      display: '4.8',
      suffix: '★',
      label: t('stats.rating'),
      labelAr: null,
    },
    {
      icon: <Leaf className="w-6 h-6" />,
      value: null,
      display: '100%',
      suffix: '',
      label: t('stats.fresh'),
      labelAr: null,
    },
  ];

  return (
    <section className="py-16 relative overflow-hidden" style={{ background: 'hsl(355,60%,6%)' }}>
      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, hsl(43,100%,52%) 0px, hsl(43,100%,52%) 1px, transparent 1px, transparent 60px), repeating-linear-gradient(90deg, hsl(43,100%,52%) 0px, hsl(43,100%,52%) 1px, transparent 1px, transparent 60px)',
        }}
      />
      <div className="absolute inset-y-0 left-0 right-0 pointer-events-none" style={{ borderTop: '1px solid hsl(43,40%,15%)', borderBottom: '1px solid hsl(43,40%,15%)' }} />
      {/* Centre glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 50%, hsl(0,85%,44%,0.06) 0%, transparent 65%)' }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex flex-col items-center justify-center p-6 md:p-8 rounded-2xl group overflow-hidden"
              style={{
                background: 'hsl(355,60%,5%)',
                border: '1px solid hsl(43,40%,12%)',
              }}
            >
              {/* Hover glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: 'radial-gradient(circle at 50% 100%, hsl(43,100%,52%,0.05) 0%, transparent 70%)' }}
              />
              <div
                className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: 'linear-gradient(to right, transparent, hsl(43,100%,52%,0.5), transparent)' }}
              />

              {/* Icon */}
              <div className="mb-3" style={{ color: 'hsl(43,100%,52%)' }}>
                {stat.icon}
              </div>

              {/* Number */}
              <div
                className="font-price font-bold mb-1.5 tabular-nums leading-none"
                style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', color: 'hsl(43,100%,52%)' }}
              >
                {stat.display ? (
                  <span>{stat.display}</span>
                ) : (
                  <Counter from={0} to={stat.value!} />
                )}
                {stat.suffix && (
                  <span style={{ fontSize: '0.65em', marginLeft: '2px' }}>{stat.suffix}</span>
                )}
              </div>

              {/* Label */}
              <div
                className="font-body text-xs uppercase tracking-widest text-center"
                style={{ color: 'hsl(40,20%,50%)' }}
              >
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
