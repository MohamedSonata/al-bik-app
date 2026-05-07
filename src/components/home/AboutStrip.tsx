import { useTranslation } from 'react-i18next';
import { GoldDivider } from '@/components/ui/GoldDivider';

export function AboutStrip() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  return (
    <section id="about" className="bg-brand-charcoal overflow-hidden">
      <div className="flex flex-col md:flex-row min-h-[600px]">
        
        {/* Image Half */}
        <div 
          className="w-full md:w-1/2 min-h-[300px] md:min-h-full bg-cover bg-center"
          style={{ backgroundImage: "url('/images/about-bg.png')" }}
          role="img"
          aria-label="Restaurant Interior"
        />

        {/* Text Half */}
        <div className="w-full md:w-1/2 p-8 md:p-16 lg:p-24 flex flex-col justify-center relative">
          <div className="absolute top-8 left-8 text-8xl text-brand-gold/10 font-heading select-none">"</div>
          
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-brand-gold mb-8 relative z-10">
            {t('about.title')}
          </h2>
          
          <div className="space-y-8 relative z-10">
            <p className="font-body text-lg md:text-xl text-foreground leading-relaxed" dir="ltr">
              {t('about.bodyEn')}
            </p>
            
            <GoldDivider />
            
            <p className="font-arabic text-lg md:text-xl text-foreground leading-relaxed" dir="rtl">
              {t('about.bodyAr')}
            </p>
          </div>
          
          <div className="absolute bottom-8 right-8 text-8xl text-brand-gold/10 font-heading select-none rotate-180">"</div>
        </div>

      </div>
    </section>
  );
}