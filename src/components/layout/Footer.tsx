import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import { GoldDivider } from '@/components/ui/GoldDivider';
import { Instagram, Facebook, Phone, MessageCircle } from 'lucide-react';

export function Footer() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  return (
    <footer className="bg-brand-surface pt-16 pb-8 border-t border-brand-gold/20">
      <GoldDivider />
      <div className="container mx-auto px-4 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Quick Links */}
          <div>
            <h3 className="font-heading text-xl text-brand-gold mb-6">{t('footer.quickLinks')}</h3>
            <ul className="space-y-4 font-body">
              <li><Link href="/" className="text-muted-foreground hover:text-brand-gold transition-colors">{t('nav.home')}</Link></li>
              <li><Link href="/menu" className="text-muted-foreground hover:text-brand-gold transition-colors">{t('nav.menu')}</Link></li>
              <li><a href="/#about" className="text-muted-foreground hover:text-brand-gold transition-colors">{t('nav.about')}</a></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-heading text-xl text-brand-gold mb-6">{t('footer.followUs')}</h3>
            <div className="flex gap-4">
              <a href="#" className="p-2 bg-brand-charcoal rounded-full text-muted-foreground hover:text-brand-gold hover:bg-brand-charcoal/80 transition-all border border-brand-gold/20" aria-label="Instagram">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 bg-brand-charcoal rounded-full text-muted-foreground hover:text-brand-gold hover:bg-brand-charcoal/80 transition-all border border-brand-gold/20" aria-label="Facebook">
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-heading text-xl text-brand-gold mb-6">{t('footer.contactInfo')}</h3>
            <ul className="space-y-4 font-body text-muted-foreground">
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-brand-gold shrink-0" />
                <a href="tel:0793540333" className="hover:text-brand-gold transition-colors" dir="ltr" data-testid="link-footer-phone">
                  {t('contact.phone')}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <MessageCircle className="w-4 h-4 text-brand-gold shrink-0" />
                <a
                  href="https://wa.me/962793540333"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand-gold transition-colors"
                  data-testid="link-whatsapp"
                >
                  {t('menu.orderOnWhatsApp')}
                </a>
              </li>
              <li className="text-sm leading-relaxed">
                {isAr ? t('contact.addressAr') : t('contact.address')}
              </li>
            </ul>
          </div>
        </div>

        <div className="text-center pt-8 border-t border-brand-gold/10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="relative overflow-hidden rounded-md border" style={{ width: '36px', height: '36px', borderColor: 'hsl(43,100%,52%)' }}>
              <img
                src="/images/al-baik-logo-poster.jpg"
                alt="Al-Baik"
                style={{ position: 'absolute', width: '180%', maxWidth: 'none', top: '-4%', left: '-2%' }}
              />
            </div>
            <h2 className="font-heading text-3xl font-bold bg-gradient-to-r from-brand-crimson to-brand-gold bg-clip-text text-transparent">
              AL-BAIK
            </h2>
          </div>
          <p className="font-heading text-brand-gold/80 mb-6 tracking-widest">
            {isAr ? t('footer.taglineAr') : t('footer.taglineEn')}
          </p>
          <p className="text-sm font-body text-muted-foreground/60">
            {t('footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
}
